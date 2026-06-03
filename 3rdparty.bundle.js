define('modules/commonFunctions',["ui.api.v1"], function (UiApi) {
  var CommonFunctions = {};

  let AgentModel;
  let AgentGroups;
  let Campaigns;
  let CallVariables;
  let ContactFields;
  let Skills;

  CommonFunctions.getCallVariableByName = function (callVariableName) {
    var parts = (callVariableName || "").split(".");
    if (parts.length === 2) {
      const callVariables = CallVariables.jsonCollection;
      return !callVariables
        ? undefined
        : callVariables.find((cv) => cv.group.toLowerCase() === parts[0].toLowerCase() && cv.name.toLowerCase() === parts[1].toLowerCase());
    }
  };

  CommonFunctions.getContactFieldByName = function (contactFieldsName) {
    const contactFields = ContactFields.jsonCollection;
    return !contactFields ? undefined : contactFields.find((cf) => cf.name.toLowerCase() === contactFieldsName.toLowerCase());
  };

  CommonFunctions.getCallVariableDefaultValue = function (callVariable) {
    try {
      if (!callVariable.restrictions || !callVariable.restrictions.restrictions) return undefined;
      const defaultValue = _.findWhere(callVariable.restrictions.restrictions, {
        type: "DEFAULT_VALUE",
      });
      return !defaultValue || !defaultValue.value ? "" : defaultValue.value;
    } catch (e) {}
    return undefined;
  };

  CommonFunctions.getCampaignIdByName = function (campaignName) {
    const campaign = Campaigns.jsonCollection.find((c) => c.name.toLowerCase() === campaignName.toLowerCase());
    return !!campaign ? campaign.id : undefined;
  };

  CommonFunctions.getDispositionsByCampaignId = function(campaignId, dispositionId) {
    const campaign = Campaigns.get(campaignId);
    const dispositions = campaign.DispositionInfo().get('dispositions');
    if (!!dispositionId) {
      return dispositions.find(d => d.id === dispositionId);
    }
    return dispositions;
  };

  CommonFunctions.checkForAgentGroup = function (agentGroups, agentGroupName) {
    const expression = new RegExp(agentGroupName);
    const matches = agentGroups.jsonCollection.filter((ag) => expression.test(ag.name));
    return matches.length > 0;
  };

  CommonFunctions.checkForSkill = function (skillName) {
    const expression = new RegExp(skillName);
    const matches = Skills.jsonCollection.filter((s) => expression.test(s.name));
    return matches.length > 0;
  };

  CommonFunctions.initialize = function () {
    UiApi.Logger.info("CommonFunctions", "initialize");
  };

  CommonFunctions.onModelLoad = function () {
    AgentModel = UiApi.Root.Agent(UiApi.Context.AgentId);
    AgentGroups = AgentModel.AgentGroups();
    CallVariables = UiApi.Context.Tenant.CallVariables();
    ContactFields = UiApi.Context.Tenant.ContactFields();
    Campaigns = UiApi.Context.Tenant.Campaigns();
    Skills = AgentModel.Skills();

    AgentModel.LoginState().on("change:state", CommonFunctions.onLoginStateChanged, this);
    CommonFunctions.onLoginStateChanged(AgentModel.LoginState());

    AgentModel.on("change", CommonFunctions.refreshAgentModel, this);
    AgentGroups.on("change", CommonFunctions.refreshAgentGroups, this);
    CallVariables.on("change", CommonFunctions.refreshCallVariables, this);
    ContactFields.on("change", CommonFunctions.refreshContactFields, this);
    Campaigns.on("change", CommonFunctions.refreshCampaigns, this);
    Skills.on("change", CommonFunctions.refreshSkills, this);
  };

  CommonFunctions.onModelUnload = function () {
    AgentModel.LoginState().off("change:state", null, null);
    AgentModel.off("change", null, null);
    AgentGroups.off("change", null, null);
    CallVariables.off("change", null, null);
    ContactFields.off("change", null, null);
    Campaigns.off("change", null, null);
    Skills.off("change", null, null);
  };

  CommonFunctions.onLoginStateChanged = async function (loginState) {
    UiApi.Logger.debug("CommonFunctions", "onLoginState - state changed", loginState.get("state"));
    if (loginState.get("state") === "WORKING") {
      await AgentModel.fetch();
      await AgentGroups.fetch();
      await CallVariables.fetch();
      await ContactFields.fetch();
      await Campaigns.fetch();
      await Skills.fetch();
    }
  };

  CommonFunctions.refreshAgentModel = async function () {
    await AgentModel.fetch();
  };

  CommonFunctions.refreshAgentGroups = async function () {
    AgentGroups = UiApi.Root.Agent(UiApi.Context.AgentId).AgentGroups();
    await AgentGroups.fetch();
  };

  CommonFunctions.refreshCallVariables = async function () {
    await CallVariables.fetch();
  };

  CommonFunctions.refreshContactFields = async function () {
    await ContactFields.fetch();
  };

  CommonFunctions.refreshCampaigns = async function () {
    await Campaigns.fetch();
  };

  CommonFunctions.refreshSkills = async function () {
    await Skills.fetch();
  };

  return CommonFunctions;
});

/*!
 * Five9 CRM SDK Javascript library
 * version: 1.0.11
 * build-version: 1.3960.0
 *
 * Copyright (c)2020 Five9, Inc.
 */

window.crmSdkVersion = '1.0.11';

(function (root, factory) {
  if (typeof define === 'function') {
    define('crmsdk',factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Five9 = root.Five9 || {};
    root.Five9.CrmSdk = factory();
  }
}(this, function () {

// We use RequireJS modules inside.
// Since this library can be included into projects with JS/node modules support
// we need to prevent using outer exports definition.
if (typeof(exports) !== 'undefined'){
  exports = undefined;
}

/**
 * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
      defined = {},
      waiting = {},
      config = {},
      defining = {},
      hasOwn = Object.prototype.hasOwnProperty,
      aps = [].slice,
      jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
          foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
          baseParts = baseName && baseName.split("/"),
          map = config.map,
          starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
          index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
        return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relParts) {
        var plugin,
          parts = splitPrefix(name),
          prefix = parts[0],
          relResourceName = relParts[1];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relResourceName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
            } else {
                name = normalize(name, relResourceName);
            }
        } else {
            name = normalize(name, relResourceName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, relParts,
          args = [],
          callbackType = typeof callback,
          usingExports;

        //Use name if no relName
        relName = relName || name;
        relParts = makeRelParts(relName);

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                  hasProp(waiting, depName) ||
                  hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                  cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, makeRelParts(callback)).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almondlib", function(){});

!function(n,r){"object"==typeof exports&&"undefined"!=typeof module?module.exports=r():"function"==typeof define&&define.amd?define("underscore",r):(n="undefined"!=typeof globalThis?globalThis:n||self,function(){var t=n._,e=n._=r();e.noConflict=function(){return n._=t,e}}())}(this,(function(){
//     Underscore.js 1.13.1
//     https://underscorejs.org
//     (c) 2009-2021 Jeremy Ashkenas, Julian Gonggrijp, and DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
var n="1.13.1",r="object"==typeof self&&self.self===self&&self||"object"==typeof global&&global.global===global&&global||Function("return this")()||{},t=Array.prototype,e=Object.prototype,u="undefined"!=typeof Symbol?Symbol.prototype:null,o=t.push,i=t.slice,a=e.toString,f=e.hasOwnProperty,c="undefined"!=typeof ArrayBuffer,l="undefined"!=typeof DataView,s=Array.isArray,p=Object.keys,v=Object.create,h=c&&ArrayBuffer.isView,y=isNaN,d=isFinite,g=!{toString:null}.propertyIsEnumerable("toString"),b=["valueOf","isPrototypeOf","toString","propertyIsEnumerable","hasOwnProperty","toLocaleString"],m=Math.pow(2,53)-1;function j(n,r){return r=null==r?n.length-1:+r,function(){for(var t=Math.max(arguments.length-r,0),e=Array(t),u=0;u<t;u++)e[u]=arguments[u+r];switch(r){case 0:return n.call(this,e);case 1:return n.call(this,arguments[0],e);case 2:return n.call(this,arguments[0],arguments[1],e)}var o=Array(r+1);for(u=0;u<r;u++)o[u]=arguments[u];return o[r]=e,n.apply(this,o)}}function _(n){var r=typeof n;return"function"===r||"object"===r&&!!n}function w(n){return void 0===n}function A(n){return!0===n||!1===n||"[object Boolean]"===a.call(n)}function x(n){var r="[object "+n+"]";return function(n){return a.call(n)===r}}var S=x("String"),O=x("Number"),M=x("Date"),E=x("RegExp"),B=x("Error"),N=x("Symbol"),I=x("ArrayBuffer"),T=x("Function"),k=r.document&&r.document.childNodes;"function"!=typeof/./&&"object"!=typeof Int8Array&&"function"!=typeof k&&(T=function(n){return"function"==typeof n||!1});var D=T,R=x("Object"),F=l&&R(new DataView(new ArrayBuffer(8))),V="undefined"!=typeof Map&&R(new Map),P=x("DataView");var q=F?function(n){return null!=n&&D(n.getInt8)&&I(n.buffer)}:P,U=s||x("Array");function W(n,r){return null!=n&&f.call(n,r)}var z=x("Arguments");!function(){z(arguments)||(z=function(n){return W(n,"callee")})}();var L=z;function $(n){return O(n)&&y(n)}function C(n){return function(){return n}}function K(n){return function(r){var t=n(r);return"number"==typeof t&&t>=0&&t<=m}}function J(n){return function(r){return null==r?void 0:r[n]}}var G=J("byteLength"),H=K(G),Q=/\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\]/;var X=c?function(n){return h?h(n)&&!q(n):H(n)&&Q.test(a.call(n))}:C(!1),Y=J("length");function Z(n,r){r=function(n){for(var r={},t=n.length,e=0;e<t;++e)r[n[e]]=!0;return{contains:function(n){return r[n]},push:function(t){return r[t]=!0,n.push(t)}}}(r);var t=b.length,u=n.constructor,o=D(u)&&u.prototype||e,i="constructor";for(W(n,i)&&!r.contains(i)&&r.push(i);t--;)(i=b[t])in n&&n[i]!==o[i]&&!r.contains(i)&&r.push(i)}function nn(n){if(!_(n))return[];if(p)return p(n);var r=[];for(var t in n)W(n,t)&&r.push(t);return g&&Z(n,r),r}function rn(n,r){var t=nn(r),e=t.length;if(null==n)return!e;for(var u=Object(n),o=0;o<e;o++){var i=t[o];if(r[i]!==u[i]||!(i in u))return!1}return!0}function tn(n){return n instanceof tn?n:this instanceof tn?void(this._wrapped=n):new tn(n)}function en(n){return new Uint8Array(n.buffer||n,n.byteOffset||0,G(n))}tn.VERSION=n,tn.prototype.value=function(){return this._wrapped},tn.prototype.valueOf=tn.prototype.toJSON=tn.prototype.value,tn.prototype.toString=function(){return String(this._wrapped)};var un="[object DataView]";function on(n,r,t,e){if(n===r)return 0!==n||1/n==1/r;if(null==n||null==r)return!1;if(n!=n)return r!=r;var o=typeof n;return("function"===o||"object"===o||"object"==typeof r)&&function n(r,t,e,o){r instanceof tn&&(r=r._wrapped);t instanceof tn&&(t=t._wrapped);var i=a.call(r);if(i!==a.call(t))return!1;if(F&&"[object Object]"==i&&q(r)){if(!q(t))return!1;i=un}switch(i){case"[object RegExp]":case"[object String]":return""+r==""+t;case"[object Number]":return+r!=+r?+t!=+t:0==+r?1/+r==1/t:+r==+t;case"[object Date]":case"[object Boolean]":return+r==+t;case"[object Symbol]":return u.valueOf.call(r)===u.valueOf.call(t);case"[object ArrayBuffer]":case un:return n(en(r),en(t),e,o)}var f="[object Array]"===i;if(!f&&X(r)){if(G(r)!==G(t))return!1;if(r.buffer===t.buffer&&r.byteOffset===t.byteOffset)return!0;f=!0}if(!f){if("object"!=typeof r||"object"!=typeof t)return!1;var c=r.constructor,l=t.constructor;if(c!==l&&!(D(c)&&c instanceof c&&D(l)&&l instanceof l)&&"constructor"in r&&"constructor"in t)return!1}o=o||[];var s=(e=e||[]).length;for(;s--;)if(e[s]===r)return o[s]===t;if(e.push(r),o.push(t),f){if((s=r.length)!==t.length)return!1;for(;s--;)if(!on(r[s],t[s],e,o))return!1}else{var p,v=nn(r);if(s=v.length,nn(t).length!==s)return!1;for(;s--;)if(p=v[s],!W(t,p)||!on(r[p],t[p],e,o))return!1}return e.pop(),o.pop(),!0}(n,r,t,e)}function an(n){if(!_(n))return[];var r=[];for(var t in n)r.push(t);return g&&Z(n,r),r}function fn(n){var r=Y(n);return function(t){if(null==t)return!1;var e=an(t);if(Y(e))return!1;for(var u=0;u<r;u++)if(!D(t[n[u]]))return!1;return n!==hn||!D(t[cn])}}var cn="forEach",ln="has",sn=["clear","delete"],pn=["get",ln,"set"],vn=sn.concat(cn,pn),hn=sn.concat(pn),yn=["add"].concat(sn,cn,ln),dn=V?fn(vn):x("Map"),gn=V?fn(hn):x("WeakMap"),bn=V?fn(yn):x("Set"),mn=x("WeakSet");function jn(n){for(var r=nn(n),t=r.length,e=Array(t),u=0;u<t;u++)e[u]=n[r[u]];return e}function _n(n){for(var r={},t=nn(n),e=0,u=t.length;e<u;e++)r[n[t[e]]]=t[e];return r}function wn(n){var r=[];for(var t in n)D(n[t])&&r.push(t);return r.sort()}function An(n,r){return function(t){var e=arguments.length;if(r&&(t=Object(t)),e<2||null==t)return t;for(var u=1;u<e;u++)for(var o=arguments[u],i=n(o),a=i.length,f=0;f<a;f++){var c=i[f];r&&void 0!==t[c]||(t[c]=o[c])}return t}}var xn=An(an),Sn=An(nn),On=An(an,!0);function Mn(n){if(!_(n))return{};if(v)return v(n);var r=function(){};r.prototype=n;var t=new r;return r.prototype=null,t}function En(n){return _(n)?U(n)?n.slice():xn({},n):n}function Bn(n){return U(n)?n:[n]}function Nn(n){return tn.toPath(n)}function In(n,r){for(var t=r.length,e=0;e<t;e++){if(null==n)return;n=n[r[e]]}return t?n:void 0}function Tn(n,r,t){var e=In(n,Nn(r));return w(e)?t:e}function kn(n){return n}function Dn(n){return n=Sn({},n),function(r){return rn(r,n)}}function Rn(n){return n=Nn(n),function(r){return In(r,n)}}function Fn(n,r,t){if(void 0===r)return n;switch(null==t?3:t){case 1:return function(t){return n.call(r,t)};case 3:return function(t,e,u){return n.call(r,t,e,u)};case 4:return function(t,e,u,o){return n.call(r,t,e,u,o)}}return function(){return n.apply(r,arguments)}}function Vn(n,r,t){return null==n?kn:D(n)?Fn(n,r,t):_(n)&&!U(n)?Dn(n):Rn(n)}function Pn(n,r){return Vn(n,r,1/0)}function qn(n,r,t){return tn.iteratee!==Pn?tn.iteratee(n,r):Vn(n,r,t)}function Un(){}function Wn(n,r){return null==r&&(r=n,n=0),n+Math.floor(Math.random()*(r-n+1))}tn.toPath=Bn,tn.iteratee=Pn;var zn=Date.now||function(){return(new Date).getTime()};function Ln(n){var r=function(r){return n[r]},t="(?:"+nn(n).join("|")+")",e=RegExp(t),u=RegExp(t,"g");return function(n){return n=null==n?"":""+n,e.test(n)?n.replace(u,r):n}}var $n={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},Cn=Ln($n),Kn=Ln(_n($n)),Jn=tn.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g},Gn=/(.)^/,Hn={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},Qn=/\\|'|\r|\n|\u2028|\u2029/g;function Xn(n){return"\\"+Hn[n]}var Yn=/^\s*(\w|\$)+\s*$/;var Zn=0;function nr(n,r,t,e,u){if(!(e instanceof r))return n.apply(t,u);var o=Mn(n.prototype),i=n.apply(o,u);return _(i)?i:o}var rr=j((function(n,r){var t=rr.placeholder,e=function(){for(var u=0,o=r.length,i=Array(o),a=0;a<o;a++)i[a]=r[a]===t?arguments[u++]:r[a];for(;u<arguments.length;)i.push(arguments[u++]);return nr(n,e,this,this,i)};return e}));rr.placeholder=tn;var tr=j((function(n,r,t){if(!D(n))throw new TypeError("Bind must be called on a function");var e=j((function(u){return nr(n,e,r,this,t.concat(u))}));return e})),er=K(Y);function ur(n,r,t,e){if(e=e||[],r||0===r){if(r<=0)return e.concat(n)}else r=1/0;for(var u=e.length,o=0,i=Y(n);o<i;o++){var a=n[o];if(er(a)&&(U(a)||L(a)))if(r>1)ur(a,r-1,t,e),u=e.length;else for(var f=0,c=a.length;f<c;)e[u++]=a[f++];else t||(e[u++]=a)}return e}var or=j((function(n,r){var t=(r=ur(r,!1,!1)).length;if(t<1)throw new Error("bindAll must be passed function names");for(;t--;){var e=r[t];n[e]=tr(n[e],n)}return n}));var ir=j((function(n,r,t){return setTimeout((function(){return n.apply(null,t)}),r)})),ar=rr(ir,tn,1);function fr(n){return function(){return!n.apply(this,arguments)}}function cr(n,r){var t;return function(){return--n>0&&(t=r.apply(this,arguments)),n<=1&&(r=null),t}}var lr=rr(cr,2);function sr(n,r,t){r=qn(r,t);for(var e,u=nn(n),o=0,i=u.length;o<i;o++)if(r(n[e=u[o]],e,n))return e}function pr(n){return function(r,t,e){t=qn(t,e);for(var u=Y(r),o=n>0?0:u-1;o>=0&&o<u;o+=n)if(t(r[o],o,r))return o;return-1}}var vr=pr(1),hr=pr(-1);function yr(n,r,t,e){for(var u=(t=qn(t,e,1))(r),o=0,i=Y(n);o<i;){var a=Math.floor((o+i)/2);t(n[a])<u?o=a+1:i=a}return o}function dr(n,r,t){return function(e,u,o){var a=0,f=Y(e);if("number"==typeof o)n>0?a=o>=0?o:Math.max(o+f,a):f=o>=0?Math.min(o+1,f):o+f+1;else if(t&&o&&f)return e[o=t(e,u)]===u?o:-1;if(u!=u)return(o=r(i.call(e,a,f),$))>=0?o+a:-1;for(o=n>0?a:f-1;o>=0&&o<f;o+=n)if(e[o]===u)return o;return-1}}var gr=dr(1,vr,yr),br=dr(-1,hr);function mr(n,r,t){var e=(er(n)?vr:sr)(n,r,t);if(void 0!==e&&-1!==e)return n[e]}function jr(n,r,t){var e,u;if(r=Fn(r,t),er(n))for(e=0,u=n.length;e<u;e++)r(n[e],e,n);else{var o=nn(n);for(e=0,u=o.length;e<u;e++)r(n[o[e]],o[e],n)}return n}function _r(n,r,t){r=qn(r,t);for(var e=!er(n)&&nn(n),u=(e||n).length,o=Array(u),i=0;i<u;i++){var a=e?e[i]:i;o[i]=r(n[a],a,n)}return o}function wr(n){var r=function(r,t,e,u){var o=!er(r)&&nn(r),i=(o||r).length,a=n>0?0:i-1;for(u||(e=r[o?o[a]:a],a+=n);a>=0&&a<i;a+=n){var f=o?o[a]:a;e=t(e,r[f],f,r)}return e};return function(n,t,e,u){var o=arguments.length>=3;return r(n,Fn(t,u,4),e,o)}}var Ar=wr(1),xr=wr(-1);function Sr(n,r,t){var e=[];return r=qn(r,t),jr(n,(function(n,t,u){r(n,t,u)&&e.push(n)})),e}function Or(n,r,t){r=qn(r,t);for(var e=!er(n)&&nn(n),u=(e||n).length,o=0;o<u;o++){var i=e?e[o]:o;if(!r(n[i],i,n))return!1}return!0}function Mr(n,r,t){r=qn(r,t);for(var e=!er(n)&&nn(n),u=(e||n).length,o=0;o<u;o++){var i=e?e[o]:o;if(r(n[i],i,n))return!0}return!1}function Er(n,r,t,e){return er(n)||(n=jn(n)),("number"!=typeof t||e)&&(t=0),gr(n,r,t)>=0}var Br=j((function(n,r,t){var e,u;return D(r)?u=r:(r=Nn(r),e=r.slice(0,-1),r=r[r.length-1]),_r(n,(function(n){var o=u;if(!o){if(e&&e.length&&(n=In(n,e)),null==n)return;o=n[r]}return null==o?o:o.apply(n,t)}))}));function Nr(n,r){return _r(n,Rn(r))}function Ir(n,r,t){var e,u,o=-1/0,i=-1/0;if(null==r||"number"==typeof r&&"object"!=typeof n[0]&&null!=n)for(var a=0,f=(n=er(n)?n:jn(n)).length;a<f;a++)null!=(e=n[a])&&e>o&&(o=e);else r=qn(r,t),jr(n,(function(n,t,e){((u=r(n,t,e))>i||u===-1/0&&o===-1/0)&&(o=n,i=u)}));return o}function Tr(n,r,t){if(null==r||t)return er(n)||(n=jn(n)),n[Wn(n.length-1)];var e=er(n)?En(n):jn(n),u=Y(e);r=Math.max(Math.min(r,u),0);for(var o=u-1,i=0;i<r;i++){var a=Wn(i,o),f=e[i];e[i]=e[a],e[a]=f}return e.slice(0,r)}function kr(n,r){return function(t,e,u){var o=r?[[],[]]:{};return e=qn(e,u),jr(t,(function(r,u){var i=e(r,u,t);n(o,r,i)})),o}}var Dr=kr((function(n,r,t){W(n,t)?n[t].push(r):n[t]=[r]})),Rr=kr((function(n,r,t){n[t]=r})),Fr=kr((function(n,r,t){W(n,t)?n[t]++:n[t]=1})),Vr=kr((function(n,r,t){n[t?0:1].push(r)}),!0),Pr=/[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;function qr(n,r,t){return r in t}var Ur=j((function(n,r){var t={},e=r[0];if(null==n)return t;D(e)?(r.length>1&&(e=Fn(e,r[1])),r=an(n)):(e=qr,r=ur(r,!1,!1),n=Object(n));for(var u=0,o=r.length;u<o;u++){var i=r[u],a=n[i];e(a,i,n)&&(t[i]=a)}return t})),Wr=j((function(n,r){var t,e=r[0];return D(e)?(e=fr(e),r.length>1&&(t=r[1])):(r=_r(ur(r,!1,!1),String),e=function(n,t){return!Er(r,t)}),Ur(n,e,t)}));function zr(n,r,t){return i.call(n,0,Math.max(0,n.length-(null==r||t?1:r)))}function Lr(n,r,t){return null==n||n.length<1?null==r||t?void 0:[]:null==r||t?n[0]:zr(n,n.length-r)}function $r(n,r,t){return i.call(n,null==r||t?1:r)}var Cr=j((function(n,r){return r=ur(r,!0,!0),Sr(n,(function(n){return!Er(r,n)}))})),Kr=j((function(n,r){return Cr(n,r)}));function Jr(n,r,t,e){A(r)||(e=t,t=r,r=!1),null!=t&&(t=qn(t,e));for(var u=[],o=[],i=0,a=Y(n);i<a;i++){var f=n[i],c=t?t(f,i,n):f;r&&!t?(i&&o===c||u.push(f),o=c):t?Er(o,c)||(o.push(c),u.push(f)):Er(u,f)||u.push(f)}return u}var Gr=j((function(n){return Jr(ur(n,!0,!0))}));function Hr(n){for(var r=n&&Ir(n,Y).length||0,t=Array(r),e=0;e<r;e++)t[e]=Nr(n,e);return t}var Qr=j(Hr);function Xr(n,r){return n._chain?tn(r).chain():r}function Yr(n){return jr(wn(n),(function(r){var t=tn[r]=n[r];tn.prototype[r]=function(){var n=[this._wrapped];return o.apply(n,arguments),Xr(this,t.apply(tn,n))}})),tn}jr(["pop","push","reverse","shift","sort","splice","unshift"],(function(n){var r=t[n];tn.prototype[n]=function(){var t=this._wrapped;return null!=t&&(r.apply(t,arguments),"shift"!==n&&"splice"!==n||0!==t.length||delete t[0]),Xr(this,t)}})),jr(["concat","join","slice"],(function(n){var r=t[n];tn.prototype[n]=function(){var n=this._wrapped;return null!=n&&(n=r.apply(n,arguments)),Xr(this,n)}}));var Zr=Yr({__proto__:null,VERSION:n,restArguments:j,isObject:_,isNull:function(n){return null===n},isUndefined:w,isBoolean:A,isElement:function(n){return!(!n||1!==n.nodeType)},isString:S,isNumber:O,isDate:M,isRegExp:E,isError:B,isSymbol:N,isArrayBuffer:I,isDataView:q,isArray:U,isFunction:D,isArguments:L,isFinite:function(n){return!N(n)&&d(n)&&!isNaN(parseFloat(n))},isNaN:$,isTypedArray:X,isEmpty:function(n){if(null==n)return!0;var r=Y(n);return"number"==typeof r&&(U(n)||S(n)||L(n))?0===r:0===Y(nn(n))},isMatch:rn,isEqual:function(n,r){return on(n,r)},isMap:dn,isWeakMap:gn,isSet:bn,isWeakSet:mn,keys:nn,allKeys:an,values:jn,pairs:function(n){for(var r=nn(n),t=r.length,e=Array(t),u=0;u<t;u++)e[u]=[r[u],n[r[u]]];return e},invert:_n,functions:wn,methods:wn,extend:xn,extendOwn:Sn,assign:Sn,defaults:On,create:function(n,r){var t=Mn(n);return r&&Sn(t,r),t},clone:En,tap:function(n,r){return r(n),n},get:Tn,has:function(n,r){for(var t=(r=Nn(r)).length,e=0;e<t;e++){var u=r[e];if(!W(n,u))return!1;n=n[u]}return!!t},mapObject:function(n,r,t){r=qn(r,t);for(var e=nn(n),u=e.length,o={},i=0;i<u;i++){var a=e[i];o[a]=r(n[a],a,n)}return o},identity:kn,constant:C,noop:Un,toPath:Bn,property:Rn,propertyOf:function(n){return null==n?Un:function(r){return Tn(n,r)}},matcher:Dn,matches:Dn,times:function(n,r,t){var e=Array(Math.max(0,n));r=Fn(r,t,1);for(var u=0;u<n;u++)e[u]=r(u);return e},random:Wn,now:zn,escape:Cn,unescape:Kn,templateSettings:Jn,template:function(n,r,t){!r&&t&&(r=t),r=On({},r,tn.templateSettings);var e=RegExp([(r.escape||Gn).source,(r.interpolate||Gn).source,(r.evaluate||Gn).source].join("|")+"|$","g"),u=0,o="__p+='";n.replace(e,(function(r,t,e,i,a){return o+=n.slice(u,a).replace(Qn,Xn),u=a+r.length,t?o+="'+\n((__t=("+t+"))==null?'':_.escape(__t))+\n'":e?o+="'+\n((__t=("+e+"))==null?'':__t)+\n'":i&&(o+="';\n"+i+"\n__p+='"),r})),o+="';\n";var i,a=r.variable;if(a){if(!Yn.test(a))throw new Error("variable is not a bare identifier: "+a)}else o="with(obj||{}){\n"+o+"}\n",a="obj";o="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+o+"return __p;\n";try{i=new Function(a,"_",o)}catch(n){throw n.source=o,n}var f=function(n){return i.call(this,n,tn)};return f.source="function("+a+"){\n"+o+"}",f},result:function(n,r,t){var e=(r=Nn(r)).length;if(!e)return D(t)?t.call(n):t;for(var u=0;u<e;u++){var o=null==n?void 0:n[r[u]];void 0===o&&(o=t,u=e),n=D(o)?o.call(n):o}return n},uniqueId:function(n){var r=++Zn+"";return n?n+r:r},chain:function(n){var r=tn(n);return r._chain=!0,r},iteratee:Pn,partial:rr,bind:tr,bindAll:or,memoize:function(n,r){var t=function(e){var u=t.cache,o=""+(r?r.apply(this,arguments):e);return W(u,o)||(u[o]=n.apply(this,arguments)),u[o]};return t.cache={},t},delay:ir,defer:ar,throttle:function(n,r,t){var e,u,o,i,a=0;t||(t={});var f=function(){a=!1===t.leading?0:zn(),e=null,i=n.apply(u,o),e||(u=o=null)},c=function(){var c=zn();a||!1!==t.leading||(a=c);var l=r-(c-a);return u=this,o=arguments,l<=0||l>r?(e&&(clearTimeout(e),e=null),a=c,i=n.apply(u,o),e||(u=o=null)):e||!1===t.trailing||(e=setTimeout(f,l)),i};return c.cancel=function(){clearTimeout(e),a=0,e=u=o=null},c},debounce:function(n,r,t){var e,u,o,i,a,f=function(){var c=zn()-u;r>c?e=setTimeout(f,r-c):(e=null,t||(i=n.apply(a,o)),e||(o=a=null))},c=j((function(c){return a=this,o=c,u=zn(),e||(e=setTimeout(f,r),t&&(i=n.apply(a,o))),i}));return c.cancel=function(){clearTimeout(e),e=o=a=null},c},wrap:function(n,r){return rr(r,n)},negate:fr,compose:function(){var n=arguments,r=n.length-1;return function(){for(var t=r,e=n[r].apply(this,arguments);t--;)e=n[t].call(this,e);return e}},after:function(n,r){return function(){if(--n<1)return r.apply(this,arguments)}},before:cr,once:lr,findKey:sr,findIndex:vr,findLastIndex:hr,sortedIndex:yr,indexOf:gr,lastIndexOf:br,find:mr,detect:mr,findWhere:function(n,r){return mr(n,Dn(r))},each:jr,forEach:jr,map:_r,collect:_r,reduce:Ar,foldl:Ar,inject:Ar,reduceRight:xr,foldr:xr,filter:Sr,select:Sr,reject:function(n,r,t){return Sr(n,fr(qn(r)),t)},every:Or,all:Or,some:Mr,any:Mr,contains:Er,includes:Er,include:Er,invoke:Br,pluck:Nr,where:function(n,r){return Sr(n,Dn(r))},max:Ir,min:function(n,r,t){var e,u,o=1/0,i=1/0;if(null==r||"number"==typeof r&&"object"!=typeof n[0]&&null!=n)for(var a=0,f=(n=er(n)?n:jn(n)).length;a<f;a++)null!=(e=n[a])&&e<o&&(o=e);else r=qn(r,t),jr(n,(function(n,t,e){((u=r(n,t,e))<i||u===1/0&&o===1/0)&&(o=n,i=u)}));return o},shuffle:function(n){return Tr(n,1/0)},sample:Tr,sortBy:function(n,r,t){var e=0;return r=qn(r,t),Nr(_r(n,(function(n,t,u){return{value:n,index:e++,criteria:r(n,t,u)}})).sort((function(n,r){var t=n.criteria,e=r.criteria;if(t!==e){if(t>e||void 0===t)return 1;if(t<e||void 0===e)return-1}return n.index-r.index})),"value")},groupBy:Dr,indexBy:Rr,countBy:Fr,partition:Vr,toArray:function(n){return n?U(n)?i.call(n):S(n)?n.match(Pr):er(n)?_r(n,kn):jn(n):[]},size:function(n){return null==n?0:er(n)?n.length:nn(n).length},pick:Ur,omit:Wr,first:Lr,head:Lr,take:Lr,initial:zr,last:function(n,r,t){return null==n||n.length<1?null==r||t?void 0:[]:null==r||t?n[n.length-1]:$r(n,Math.max(0,n.length-r))},rest:$r,tail:$r,drop:$r,compact:function(n){return Sr(n,Boolean)},flatten:function(n,r){return ur(n,r,!1)},without:Kr,uniq:Jr,unique:Jr,union:Gr,intersection:function(n){for(var r=[],t=arguments.length,e=0,u=Y(n);e<u;e++){var o=n[e];if(!Er(r,o)){var i;for(i=1;i<t&&Er(arguments[i],o);i++);i===t&&r.push(o)}}return r},difference:Cr,unzip:Hr,transpose:Hr,zip:Qr,object:function(n,r){for(var t={},e=0,u=Y(n);e<u;e++)r?t[n[e]]=r[e]:t[n[e][0]]=n[e][1];return t},range:function(n,r,t){null==r&&(r=n||0,n=0),t||(t=r<n?-1:1);for(var e=Math.max(Math.ceil((r-n)/t),0),u=Array(e),o=0;o<e;o++,n+=t)u[o]=n;return u},chunk:function(n,r){if(null==r||r<1)return[];for(var t=[],e=0,u=n.length;e<u;)t.push(i.call(n,e,e+=r));return t},mixin:Yr,default:tn});return Zr._=Zr,Zr}));
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/object',['underscore'], function (_) {
  var Object = function Object() {
    this._destructors = [];

    if (_(this._init).isFunction()) {
      this._init.apply(this, arguments);
    }
  };

  Object.extend = function (protoProps, staticProps) {
    var Super = this;
    var Sub = function Sub() {
      Super.apply(this, arguments);
    };

    _(Sub).extend(Super, staticProps);

    var SuperClone = function SuperClone() {};
    SuperClone.prototype = Super.prototype;
    Sub.prototype = new SuperClone();

    _(Sub.prototype).extend(protoProps);
    Sub.prototype._super = Super.prototype;

    return Sub;
  };

  Object.mixin = function (protoProps, staticProps) {
    _(this.prototype).extend(protoProps);
    _(this).extend(staticProps || {});
  };

  Object.mixin({
    bind: function bind(f) {
      return _.bind(f, this);
    },

    destroy: function destroy() {
      _.each(this._destructors, function (destructor) {
        destructor();
      });
    }
  });

  return Object;
});
//# sourceMappingURL=object.js.map
;
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/message',['msgbus/object', 'underscore'], function (Object, _) {
  var MessageType = {
    isResponse: function isResponse(raw) {
      return !_(raw.response).isUndefined();
    },

    isEvent: function isEvent(raw) {
      return !_(raw.event).isUndefined();
    },

    isError: function isError(raw) {
      return !_(raw.error).isUndefined();
    },

    isCommunicatonError: function isCommunicatonError(raw) {
      return !_(raw.communicationError).isUndefined();
    },

    isConnect: function isConnect(raw) {
      return _.isString(raw) && raw.indexOf('connect') === 0;
    },

    isConnected: function isConnected(raw) {
      return _.isString(raw) && raw.indexOf('connected:') === 0;
    },

    isRequest: function isRequest(raw) {
      return !_(raw.request).isUndefined();
    },

    isDisconnect: function isDisconnect(raw) {
      return _.isString(raw) && raw.indexOf('disconnect') === 0;
    }
  };

  var Message = Object.extend({
    _init: function _init(raw) {
      this._type = 'unknown';

      if (MessageType.isResponse(raw)) {
        this._type = 'response';
        this._id = raw.id;
        this._data = raw.response;
      } else if (MessageType.isEvent(raw)) {
        this._type = 'event';
        this._data = raw.event;
      } else if (MessageType.isError(raw)) {
        this._type = 'error';
        this._id = raw.id;
        this._data = raw.error;
      } else if (MessageType.isCommunicatonError(raw)) {
        this._type = 'communication:error';
        this._data = raw.communicationError;
      } else if (MessageType.isConnected(raw)) {
        this._type = 'connected';
        this._data = raw.slice('connected:'.length);
        if (_.isEmpty(this._data)) {
          delete this._data;
        }
      } else if (MessageType.isConnect(raw)) {
        this._type = 'connect';
        this._data = '';
      } else if (MessageType.isRequest(raw)) {
        this._type = 'request';
        this._id = raw.id;
        this._data = raw.request;
      } else if (MessageType.isDisconnect(raw)) {
        this._type = 'disconnect';
        this._data = '';
      }
    },

    data: function data() {
      return this._data;
    },

    id: function id() {
      return this._id;
    },

    type: function type() {
      return this._type;
    }
  });

  return Message;
});
//# sourceMappingURL=message.js.map
;
!function(){var n,e,r,t,u,o,i,l,s,a,c,f,p,h,y=[].slice;u="3.0.0",e="pending",t="resolved",r="rejected",s=function(n,e){return null!=n?n.hasOwnProperty(e):void 0},c=function(n){return s(n,"length")&&s(n,"callee")},f=function(n){return s(n,"promise")&&"function"==typeof(null!=n?n.promise:void 0)},l=function(n){return c(n)?l(Array.prototype.slice.call(n)):Array.isArray(n)?n.reduce(function(n,e){return Array.isArray(e)?n.concat(l(e)):(n.push(e),n)},[]):[n]},o=function(n,e){return 0>=n?e():function(){return--n<1?e.apply(this,arguments):void 0}},p=function(n,e){return function(){var r;return r=[n].concat(Array.prototype.slice.call(arguments,0)),e.apply(this,r)}},i=function(n,e,r){var t,u,o,i,s;for(i=l(n),s=[],u=0,o=i.length;o>u;u++)t=i[u],s.push(t.call.apply(t,[r].concat(y.call(e))));return s},n=function(){var u,o,s,a,c,p,h;return h=e,a=[],c=[],p=[],s={resolved:{},rejected:{},pending:{}},this.promise=function(u){var o,d;return u=u||{},u.state=function(){return h},d=function(n,r,t){return function(){return h===e&&r.push.apply(r,l(arguments)),n()&&i(arguments,s[t]),u}},u.done=d(function(){return h===t},a,t),u.fail=d(function(){return h===r},c,r),u.progress=d(function(){return h!==e},p,e),u.always=function(){var n;return(n=u.done.apply(u,arguments)).fail.apply(n,arguments)},o=function(e,r,t){var o,i;return i=new n,o=function(n,e,r){return r?u[n](function(){var n,t;return n=1<=arguments.length?y.call(arguments,0):[],t=r.apply(null,n),f(t)?t.done(i.resolve).fail(i.reject).progress(i.notify):i[e](t)}):u[n](i[e])},o("done","resolve",e),o("fail","reject",r),o("progress","notify",t),i},u.pipe=o,u.then=o,null==u.promise&&(u.promise=function(){return u}),u},this.promise(this),u=this,o=function(n,r,t){return function(){return h===e?(h=n,s[n]=arguments,i(r,s[n],t),u):this}},this.resolve=o(t,a),this.reject=o(r,c),this.notify=o(e,p),this.resolveWith=function(n,e){return o(t,a,n).apply(null,e)},this.rejectWith=function(n,e){return o(r,c,n).apply(null,e)},this.notifyWith=function(n,r){return o(e,p,n).apply(null,r)},this},h=function(){var e,r,t,u,i,s,a;if(r=l(arguments),1===r.length)return f(r[0])?r[0]:(new n).resolve(r[0]).promise();if(i=new n,!r.length)return i.resolve().promise();for(u=[],t=o(r.length,function(){return i.resolve.apply(i,u)}),r.forEach(function(n,e){return f(n)?n.done(function(){var n;return n=1<=arguments.length?y.call(arguments,0):[],u[e]=n.length>1?n:n[0],t()}):(u[e]=n,t())}),s=0,a=r.length;a>s;s++)e=r[s],f(e)&&e.fail(i.reject);return i.promise()},a=function(e){return e.Deferred=function(){return new n},e.ajax=p(e.ajax,function(e,r){var t,u,o,i;return null==r&&(r={}),u=new n,t=function(n,e){return p(n,function(){var n,r;return r=arguments[0],n=2<=arguments.length?y.call(arguments,1):[],r&&r.apply(null,n),e.apply(null,n)})},r.success=t(r.success,u.resolve),r.error=t(r.error,u.reject),i=e(r),o=u.promise(),o.abort=function(){return i.abort()},o}),e.when=h},"undefined"!=typeof exports?(exports.Deferred=function(){return new n},exports.when=h,exports.installInto=a):"function"==typeof define&&define.amd?define('simply.deferred',[],function(){return"undefined"!=typeof Zepto?a(Zepto):(n.when=h,n.installInto=a,n)}):"undefined"!=typeof Zepto?a(Zepto):(this.Deferred=function(){return new n},this.Deferred.when=h,this.Deferred.installInto=a)}.call(this);
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/deferred',['underscore', 'simply.deferred', 'msgbus/object'], function (_, Deferred, Object) {
  var DeferredWrapper = Object.extend({
    _init: function _init() {
      this._deferred = new Deferred();
    },

    resolve: function resolve() {
      var args = arguments;

      _.defer(_.bind(function () {
        this._deferred.resolve.apply(this._deferred, args);
      }, this));

      return this;
    },

    reject: function reject() {
      var args = arguments;

      _.defer(_.bind(function () {
        this._deferred.reject.apply(this._deferred, args);
      }, this));

      return this;
    },

    promise: function promise() {
      return this._deferred.promise();
    }
  });

  return DeferredWrapper;
});
//# sourceMappingURL=deferred.js.map
;
/*! backbone-events-standalone 0.2.6 2015-05-18 */
!function(){function a(){return{keys:Object.keys||function(a){if("object"!=typeof a&&"function"!=typeof a||null===a)throw new TypeError("keys() called on a non-object");var b,c=[];for(b in a)a.hasOwnProperty(b)&&(c[c.length]=b);return c},uniqueId:function(a){var b=++g+"";return a?a+b:b},has:function(a,b){return e.call(a,b)},each:function(a,b,c){if(null!=a)if(d&&a.forEach===d)a.forEach(b,c);else if(a.length===+a.length)for(var e=0,f=a.length;f>e;e++)b.call(c,a[e],e,a);else for(var g in a)this.has(a,g)&&b.call(c,a[g],g,a)},once:function(a){var b,c=!1;return function(){return c?b:(c=!0,b=a.apply(this,arguments),a=null,b)}}}}var b,c=this,d=Array.prototype.forEach,e=Object.prototype.hasOwnProperty,f=Array.prototype.slice,g=0,h=a();b={on:function(a,b,c){if(!j(this,"on",a,[b,c])||!b)return this;this._events||(this._events={});var d=this._events[a]||(this._events[a]=[]);return d.push({callback:b,context:c,ctx:c||this}),this},once:function(a,b,c){if(!j(this,"once",a,[b,c])||!b)return this;var d=this,e=h.once(function(){d.off(a,e),b.apply(this,arguments)});return e._callback=b,this.on(a,e,c)},off:function(a,b,c){var d,e,f,g,i,k,l,m;if(!this._events||!j(this,"off",a,[b,c]))return this;if(!a&&!b&&!c)return this._events={},this;for(g=a?[a]:h.keys(this._events),i=0,k=g.length;k>i;i++)if(a=g[i],f=this._events[a]){if(this._events[a]=d=[],b||c)for(l=0,m=f.length;m>l;l++)e=f[l],(b&&b!==e.callback&&b!==e.callback._callback||c&&c!==e.context)&&d.push(e);d.length||delete this._events[a]}return this},trigger:function(a){if(!this._events)return this;var b=f.call(arguments,1);if(!j(this,"trigger",a,b))return this;var c=this._events[a],d=this._events.all;return c&&k(c,b),d&&k(d,arguments),this},stopListening:function(a,b,c){var d=this._listeners;if(!d)return this;var e=!b&&!c;"object"==typeof b&&(c=this),a&&((d={})[a._listenerId]=a);for(var f in d)d[f].off(b,c,this),e&&delete this._listeners[f];return this}};var i=/\s+/,j=function(a,b,c,d){if(!c)return!0;if("object"==typeof c){for(var e in c)a[b].apply(a,[e,c[e]].concat(d));return!1}if(i.test(c)){for(var f=c.split(i),g=0,h=f.length;h>g;g++)a[b].apply(a,[f[g]].concat(d));return!1}return!0},k=function(a,b){var c,d=-1,e=a.length,f=b[0],g=b[1],h=b[2];switch(b.length){case 0:for(;++d<e;)(c=a[d]).callback.call(c.ctx);return;case 1:for(;++d<e;)(c=a[d]).callback.call(c.ctx,f);return;case 2:for(;++d<e;)(c=a[d]).callback.call(c.ctx,f,g);return;case 3:for(;++d<e;)(c=a[d]).callback.call(c.ctx,f,g,h);return;default:for(;++d<e;)(c=a[d]).callback.apply(c.ctx,b)}},l={listenTo:"on",listenToOnce:"once"};h.each(l,function(a,c){b[c]=function(b,c,d){var e=this._listeners||(this._listeners={}),f=b._listenerId||(b._listenerId=h.uniqueId("l"));return e[f]=b,"object"==typeof c&&(d=this),b[a](c,d,this),this}}),b.bind=b.on,b.unbind=b.off,b.mixin=function(a){var b=["on","once","off","trigger","stopListening","listenTo","listenToOnce","bind","unbind"];return h.each(b,function(b){a[b]=this[b]},this),a},"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=b),exports.BackboneEvents=b):"function"==typeof define&&"object"==typeof define.amd?define('backbone.events',[],function(){return b}):c.BackboneEvents=b}(this);
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/events',['underscore', 'backbone.events'], function (_, BackboneEvents) {
  var Events = _.clone(BackboneEvents);

  Events._originalTrigger = Events.trigger;

  Events.trigger = function () {
    var args = arguments;

    _.defer(_.bind(function () {
      Events._originalTrigger.apply(this, args);
    }, this));
  };

  delete Events.bind;
  delete Events.unbind;

  return Events;
});
//# sourceMappingURL=events.js.map
;
define('msgbus/utils',['underscore'], function (_) {
  var forEachIframe = function forEachIframe(func) {
    // Due to different security restrictions on some sites (Salesforce Lightning, ServiceNow Agent Workspace, may be others)
    // we might not have an access to 'frames' property in top/parent window objects.
    // So we are going to construct a list of all frames on the page collecting frames
    // from bottom (window) to top (window.parent(s)/window.top) objects.
    var frames = [];

    // Add a frame and all it's subframes to the list
    var _pushAllFrames = function _pushAllFrames(frame) {
      if (!frame || _.contains(frames, frame)) {
        return;
      }

      frames.push(frame);

      try {
        for (var i = 0; i < frame.frames.length; i++) {
          if (frame.frames[i]) {
            _pushAllFrames(frame.frames[i]);
          }
        }
      } catch (err) {
        // do nothing
      }
    };

    try {
      // Go through all windows from the current one to top
      var cWindow = window;
      var _continue = true;
      while (_continue) {
        _pushAllFrames(cWindow);

        if (cWindow.parent && cWindow.parent !== cWindow) {
          cWindow = cWindow.parent;
        } else {
          _continue = false;
        }
      }

      // In theory window.top has been already added to the list
      // but according to documentation support of window.parent is not guaranty in all browsers.
      // So let's try to add window.top one more time
      _pushAllFrames(window.top);
    } catch (err) {
      // Do nothing
    }

    _.each(frames, function (frame) {
      try {
        func(frame);
      } catch (err) {
        // do nothing
      }
    });
  };

  var randomId = function randomId(str) {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return str + '-' + s4() + s4() + s4() + s4();
  };

  return { randomId: randomId, forEachIframe: forEachIframe };
});
//# sourceMappingURL=utils.js.map
;
define('msgbus/channel',['msgbus/object', 'msgbus/message', 'msgbus/deferred', 'msgbus/events', 'underscore', 'msgbus/utils'], function (Object, Message, Deferred, Events, _, Utils) {
  var Dispatcher = Object.extend(Events);

  var REQUEST_ID_SEPARATOR = '#';

  var Channel = Object.extend({
    connect: function connect(options) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (!this._connectPromise || this._connectPromise.state() === 'rejected') {
        var requestFunc = this.bind(function () {
          this._logDebug('connecting...');

          this._io.connect();
        });

        options = _.extend({}, { timeout: 15000 }, options);
        this._connectPromise = this._doRequest({ requestId: 'connect', requestFunc: requestFunc }, options);
      } else if (force && this._connectPromise.state() === 'resolved') {
        // Ask io to connect but keep the current connect promise
        this._io.connect();
      }

      return this._connectPromise;
    },

    sendRequest: function sendRequest(request, options) {
      var requestId = '' + this._channelId + REQUEST_ID_SEPARATOR + _.uniqueId();

      var requestFunc = this.bind(function () {
        var msg = {
          hostId: this._hostId,
          id: requestId,
          request: request
        };

        this._logDebug('sending request:', msg.id, '[content hidden]');

        this._send(msg);
      });

      return this._doRequest({ requestId: requestId, requestFunc: requestFunc }, options);
    },

    sendResponse: function sendResponse(response, id) {
      var responseFunc = this.bind(function () {
        var msg = {
          id: id,
          response: response
        };

        this._logDebug('sending response:', response, ', id:', id);

        this._send(msg);
      });

      this._doResponse(responseFunc);
    },

    sendErrorResponse: function sendErrorResponse(error, id) {
      var responseFunc = this.bind(function () {
        var msg = {
          id: id,
          error: error
        };

        this._logDebug('sending error response:', error, ', id:', id);

        this._send(msg);
      });

      this._doResponse(responseFunc);
    },

    sendEvent: function sendEvent(event) {
      var eventFunc = this.bind(function () {
        var msg = {
          event: event
        };

        this._logDebug('sending event:', event);

        this._send(msg);
      });

      this._doEvent(eventFunc);
    },

    onEvent: function onEvent(fn) {
      this._dispatcher.on('event', fn);
    },

    offEvent: function offEvent(fn) {
      this._dispatcher.off('event', fn);
    },

    onCommunicationError: function onCommunicationError(fn) {
      this._dispatcher.on('communication:error', fn);
    },

    isConnected: function isConnected() {
      return !!this._connectPromise && this._connectPromise.state() === 'resolved';
    },

    setRequestHandler: function setRequestHandler(handler) {
      this._requestHandler = handler;
    },

    setOnConnectCallback: function setOnConnectCallback(callback) {
      this._onConnectCallbacks.push(callback);
    },

    _init: function _init(io) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._channelId = Utils.randomId(io.getName());
      this._io = io;
      this._options = options;
      this._pendingRequests = {};
      this._defaultOptions = { timeout: 60000, retries: 1 };
      this._dispatcher = new Dispatcher();
      this._io.onMessage(this.bind(this._dispatch));
      this._dispatcher.on('connect', this.bind(this._onConnect));
      this._dispatcher.on('connected', this.bind(this._onConnected));
      this._dispatcher.on('disconnect', this.bind(this._onDisconnect));
      this._dispatcher.on('request', this.bind(this._onRequest));
      this._dispatcher.on('response', this.bind(this._resolvePendingRequest));
      this._dispatcher.on('error', this.bind(this._rejectPendingRequest));
      this._dispatcher.on('communication:error', this.bind(this._rejectAllPendingRequests));

      this._onConnectCallbacks = [];

      if (this._options.autoConnect) {
        var autoConnect = this._options.autoConnect;
        var connectOptions = {
          timeout: autoConnect.timeout,
          retries: autoConnect.retries
        };

        this.connect(connectOptions);

        if (autoConnect.refreshInterval && autoConnect.refreshInterval !== 0) {
          this._refreshIntervalHandle = setInterval(this.bind(function () {
            this.connect(connectOptions, true);
          }), autoConnect.refreshInterval);

          this._destructors.push(this.bind(function () {
            clearInterval(this._refreshIntervalHandle);
          }));
        }
      }

      this._destructors.push(this.bind(function () {
        this._io.destroy();
        this._dispatcher.destroy();
      }));

      this._logDebug('initialized');
    },

    _send: function _send(msg) {
      var _this = this;

      var autoConnect = this._options.autoConnect;
      if (autoConnect) {
        this.connect(autoConnect).done(function () {
          return _this._sendToIO(msg);
        });
      } else {
        this._sendToIO(msg);
      }
    },

    // overridden in child
    _sendToIO: function _sendToIO(msg) {
      this._io.send(msg);
    },

    _dispatch: function _dispatch(raw) {
      if (_(raw.hostId).isUndefined() || raw.hostId === this._hostId) {
        var msg = new Message(raw);

        this._logDebug('received', msg.type() + ':', msg.data(), msg.id() ? ', id: ' + msg.id() : '');

        this._dispatcher.trigger(msg.type(), msg.data(), msg.id());
      }
    },

    _onConnect: function _onConnect() {
      var version = this._io.getVersion && this._io.getVersion() ? '' + this._io.getVersion() : '';
      // connectedData structure: <hostId>:<io_name>:<version>
      // NOTE: <hostId> should be always empty for SDK
      var connectedData = ':' + this._io.getName() + ':' + version;

      this._logDebug('Got connect message. Send "connected:' + connectedData);
      this._io.send('connected:' + connectedData);

      if (!this._resolvePendingRequest(undefined, 'connect')) {
        this._connectPromise = new Deferred().resolve().promise();
      }

      this._onConnectCallbacks.forEach(function (callback) {
        callback();
      });
    },

    _onConnected: function _onConnected(connectedData) {
      this._logDebug('connected:' + connectedData);
      if (connectedData) {
        var parts = connectedData.split(':');
        if (parts[0]) {
          this._hostId = parts[0];
        }
      }

      this._resolvePendingRequest(undefined, 'connect');
    },

    _onDisconnect: function _onDisconnect() {
      this._logDebug('disconnected');
      delete this._connectPromise;
    },

    _onRequest: function _onRequest(data, msgId) {
      this._requestHandler.handle(data, msgId);
    },

    _doResponse: function _doResponse(responseFunc) {
      responseFunc.call(this);
    },

    _doEvent: function _doEvent(eventFunc) {
      eventFunc.call(this);
    },

    _doRequest: function _doRequest(requestObj, options, pending) {
      options = _.extend({}, { requestObj: requestObj }, options);
      var promise = this._savePendingRequest(options, pending);

      requestObj.requestFunc.call(this);

      return promise;
    },

    _savePendingRequest: function _savePendingRequest(options, pending) {
      options = _.extend({}, this._defaultOptions, options);
      var msgId = options.requestObj.requestId;

      if (!_(this._pendingRequests[msgId]).isObject()) {
        var timerId = setTimeout(this.bind(function () {
          this._logDebug('timeout for request with id:', msgId);

          this._rejectPendingRequest('Timeout', msgId);
        }), options.timeout);

        this._pendingRequests[msgId] = {
          deferred: _(pending).isObject() ? pending.deferred : new Deferred(),
          timerId: timerId,
          options: options
        };
      }

      return this._pendingRequests[msgId].deferred.promise();
    },

    _resolvePendingRequest: function _resolvePendingRequest(response, msgId) {
      return this._handlePendingRequest('resolve', response, msgId);
    },

    _rejectPendingRequest: function _rejectPendingRequest(error, msgId, noretry) {
      return this._handlePendingRequest('reject', error, msgId, noretry);
    },

    _handlePendingRequest: function _handlePendingRequest(method, msg, msgId, noretry) {
      var pending = this._pendingRequests[msgId];

      if (!_(pending).isUndefined()) {
        clearTimeout(pending.timerId);
        delete this._pendingRequests[msgId];
        if (noretry || !this._retryPendingRequest(method, pending)) {
          pending.deferred[method](msg);
        }
        return true;
      }
      return false;
    },

    _retryPendingRequest: function _retryPendingRequest(method, pending) {
      var options = pending.options;
      if (method === 'resolve') {
        return false;
      }

      if (options.retries === 1) {
        return false;
      }

      this._logDebug('retry pending request ', method);

      options.retries -= 1;
      this._doRequest(options.requestObj, options, pending);
      return true;
    },

    _rejectAllPendingRequests: function _rejectAllPendingRequests(error) {
      var msgIds = _(this._pendingRequests).keys();

      _(msgIds).each(this.bind(function (msgId) {
        this._rejectPendingRequest(error, msgId, true);
      }));
    },

    _addModuleName: function _addModuleName() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      args.unshift('msgbus.js channel [' + this._io.getName() + '] ');
      return args;
    },

    _logDebug: function _logDebug() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      console.debug.apply(console, this._addModuleName(args));
    },

    _logWarn: function _logWarn() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      console.warn.apply(console, this._addModuleName(args));
    },

    getState: function getState() {
      return {
        connected: this.isConnected(),
        channelId: this._channelId,
        io: this._io.getState()
      };
    }
  });

  return Channel;
});
//# sourceMappingURL=channel.js.map
;
define('msgbus/channel-throttling',['msgbus/channel', 'underscore'], function (Channel, _) {
  var defaultThrottlingOptions = {
    outgoingQueueSize: 50,
    messageRateMs: 10
  };

  var ChannelThrottling = Channel.extend({
    _init: function _init(io) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._super._init.call(this, io, options);

      this._throttlingOptions = _.extend({}, defaultThrottlingOptions, options.throttling);
      this._outgoingQueue = [];
      this._isProcessing = false;
    },

    _startOutgoingQueueProcessing: function _startOutgoingQueueProcessing() {
      var _this2 = this;

      if (this._isProcessing) {
        return;
      }

      this._logDebug('start outgoing queue processing with rate(ms):', this._throttlingOptions.messageRateMs);

      this._queueProcessor = function () {
        var _this = this;

        if (this._outgoingQueue.length > 0) {
          this._logDebug('Process message from outgoing queue. Total messages:', this._outgoingQueue.length);

          var msg = this._outgoingQueue.shift();
          this._io.send(msg);

          setTimeout(function () {
            return _this._queueProcessor();
          }, this._throttlingOptions.messageRateMs);
        } else {
          this._logDebug('No messages in queue, stop outgoing queue processing');
          this._isProcessing = false;
        }
      };

      // set timeout to 0 to send almost immediatelly
      setTimeout(function () {
        return _this2._queueProcessor();
      }, 0);
      this._isProcessing = true;
    },

    _enqueueMsg: function _enqueueMsg(msg) {
      this._startOutgoingQueueProcessing();

      if (this._outgoingQueue.length >= this._throttlingOptions.outgoingQueueSize) {
        this._logDebug('Drop message due to high api call rate:', msg);
        this._rejectPendingRequest('Message dropped', msg.id, true);
        return;
      }

      this._outgoingQueue.push(msg);
    },

    _sendToIO: function _sendToIO(msg) {
      if (msg.request || msg.event) {
        this._enqueueMsg(msg);
      } else {
        this._io.send(msg);
      }
    }
  });

  return ChannelThrottling;
});
//# sourceMappingURL=channel-throttling.js.map
;
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/event-dispatcher',['msgbus/object', 'msgbus/events'], function (Object, Events) {
  var EventDispatcher = Object.extend({
    _init: function _init(channel) {
      var eventHandler = this.bind(function (event) {
        var args = [EventDispatcher.eventId(event.objectId, event.name)].concat(event.data);
        this.trigger.apply(this, args);
      });

      channel.onEvent(eventHandler);

      this._destructors.push(this.bind(function () {
        this.off();
        channel.offEvent(eventHandler);
      }));
    }
  }, {
    eventId: function eventId(objectId, eventName) {
      return objectId + ':' + eventName;
    }
  });

  EventDispatcher.mixin(Events);

  return EventDispatcher;
});
//# sourceMappingURL=event-dispatcher.js.map
;
define('msgbus/api-object',['msgbus/object', 'msgbus/events', 'underscore'], function (Object, Events, _) {
  var ApiObject = Object.extend({
    _init: function _init(api, apiFactory, config) {
      this._api = apiFactory.defineApi(api);

      if (config.methods) {
        _.each(config.methods, this.bind(function (methodName) {
          this[methodName] = apiFactory.defineSimpleMethod(methodName);
        }));
      }

      if (config.events) {
        _.each(config.events, this.bind(function (eventName) {
          apiFactory.defineEvent(this, eventName);
        }));
      }

      this._destructors.push(this.bind(this.off));
    }
  });

  ApiObject.mixin(Events);

  return ApiObject;
});
//# sourceMappingURL=api-object.js.map
;
define('msgbus/data-object',['underscore', 'msgbus/object', 'msgbus/events'], function (_, Object, Events) {
  var DataObject = Object.extend({
    _init: function _init(data, apiFactory) {
      var _this = this;

      this._data = data;
      this._api = this._name + '_' + this.get('id');

      apiFactory.defineEvent(this, 'dataChanged');
      this.on('dataChanged', function (newData) {
        return _this.set(newData);
      });

      this.dataChanged = apiFactory.defineEventTrigger('dataChanged');

      this._destructors.push(this.bind(this.off));
    },
    get: function get(key) {
      return this._data[key];
    },
    set: function set(key, value) {
      if (_.isString(key)) {
        this._data[key] = value;
      } else if (_.isObject(key)) {
        _.extend(this._data, key);
      }
      this.trigger('change');
    },
    getData: function getData() {
      return this._data;
    }
  });

  DataObject.mixin(Events);

  return DataObject;
});
//# sourceMappingURL=data-object.js.map
;
define('msgbus/request-handler',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/data-object'], function (_, Deferred, Object, DataObject) {
  var RequestHandler = Object.extend({
    addMethodProvider: function addMethodProvider(obj, methodProvider) {
      methodProvider = methodProvider || obj;
      this._methodProviders[obj._api] = methodProvider;
    },
    registerSimpleMethodImplementation: function registerSimpleMethodImplementation(obj, name, func) {
      var _this = this;

      var methodImpl = function methodImpl() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var method = func || _this._getMethodFromProvider(obj._api, name);
        return _this._makeThenableMethod(method).apply(null, args);
      };

      var methodId = RequestHandler.methodId(obj._api, name);
      this._methodImpls[methodId] = methodImpl;
    },
    registerSimplePropertyImplementation: function registerSimplePropertyImplementation(obj, name, func) {
      var _this2 = this;

      var methodImpl = function methodImpl() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        var method = func || _this2._getMethodFromProvider(obj._api, name);
        return _this2._makeThenableMethod(method).apply(null, args);
      };

      var methodId = RequestHandler.methodId(obj._api, name);
      this._methodImpls[methodId] = methodImpl;
    },
    registerApiPropertyImplementation: function registerApiPropertyImplementation(obj, name, func) {
      var _this3 = this;

      var methodImpl = function methodImpl() {
        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        var method = func || _this3._getMethodFromProvider(obj._api, name);

        return _this3._makeThenableMethod(method).apply(null, args).then(function (object) {
          return RequestHandler.serialize(object);
        });
      };

      var methodId = RequestHandler.methodId(obj._api, name);
      this._methodImpls[methodId] = methodImpl;
    },
    registerApiArrayPropertyImplementation: function registerApiArrayPropertyImplementation(obj, name, func) {
      var _this4 = this;

      var methodImpl = function methodImpl() {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        var method = func || _this4._getMethodFromProvider(obj._api, name);

        return _this4._makeThenableMethod(method).apply(null, args).then(function () {
          var objects = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

          objects = Array.isArray(objects) ? objects : [objects];
          return _.map(objects, function (object) {
            return RequestHandler.serialize(object);
          });
        });
      };

      var methodId = RequestHandler.methodId(obj._api, name);
      this._methodImpls[methodId] = methodImpl;
    },
    handle: function handle(request, id) {
      var _this5 = this;

      var methodId = RequestHandler.methodId(request.objectId, request.attrName);
      var func = this._methodImpls[methodId];

      if (func) {
        func.call(this, request.args).then(function () {
          var response = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
          return _this5._channel.sendResponse(response, id);
        }, function () {
          var error = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Unknown error';
          return _this5._channel.sendErrorResponse(error, id);
        });
      } else {
        this._channel.sendErrorResponse('Not Implemented: \'' + request.attrName + '\' method was not registered for \'' + request.objectId + '\' api', id);
      }
    },
    _init: function _init(channel) {
      this._channel = channel;
      this._methodImpls = {};
      this._methodProviders = {};
    },
    _getMethodFromProvider: function _getMethodFromProvider(objectId, name) {
      var methodProvider = this._methodProviders[objectId];
      if (methodProvider) {
        var func = methodProvider.getMethod(name);
        if (func) {
          return func.bind(methodProvider);
        } else {
          return function () {
            return new Deferred().reject('Not Implemented: \'' + name + '\' method was not found in method provider for \'' + objectId + '\' api').promise();
          };
        }
      } else {
        return function () {
          return new Deferred().reject('Not Implemented: method provider for \'' + objectId + '\' api was not found').promise();
        };
      }
    },
    _makeThenableMethod: function _makeThenableMethod(method) {
      return function () {
        var d = new Deferred();

        try {
          for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
            args[_key5] = arguments[_key5];
          }

          var result = method.apply(this, args);
          if (result && _.isFunction(result.then)) {
            result.then(function (response) {
              d.resolve(response);
              return true;
            }, function (error) {
              d.reject(error);
              return true;
            });
          } else {
            d.resolve(result);
          }
        } catch (err) {
          d.reject('Exception thrown from an implementation method: ' + err);
        }

        return d.promise();
      };
    }
  }, {
    methodId: function methodId(objectId, methodName) {
      return objectId + ':' + methodName;
    },
    serialize: function serialize(object) {
      if (object && object instanceof DataObject) {
        return object.getData();
      }
      return object;
    }
  });

  return RequestHandler;
});
//# sourceMappingURL=request-handler.js.map
;
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/api-factory',['msgbus/channel', 'msgbus/channel-throttling', 'msgbus/object', 'msgbus/deferred', 'msgbus/event-dispatcher', 'msgbus/api-object', 'msgbus/request-handler', 'underscore'], function (Channel, ChannelThrottling, F9Object, Deferred, EventDispatcher, ApiObject, RequestHandler, _) {
  var apiFactory = F9Object.extend({
    channel: function channel() {
      return this._channel;
    },

    defineApi: function defineApi(apiId) {
      return apiId;
    },

    definePropertyOrMethod: function definePropertyOrMethod(verb, name, mapData, requestOptions) {
      var factory = this;
      return function (options) {
        var deferred = new Deferred();
        var objectId = this._api;

        factory.channel().sendRequest({
          objectId: objectId,
          verb: verb,
          attrName: name,
          args: options
        }, requestOptions).done(function (data) {
          var result = mapData(data);

          if (result.success) {
            deferred.resolve(result.data);
          } else {
            deferred.reject({ what: 'Data validation failed', data: result.data });
          }
        }).fail(function (err) {
          deferred.reject(err);
        });

        return deferred.promise();
      };
    },

    addMethodProvider: function addMethodProvider(obj, methodProvider) {
      this._requestHandler.addMethodProvider(obj, methodProvider);
    },

    defineSimpleProperty: function defineSimpleProperty(name) {
      return this.definePropertyOrMethod('get', name, function (data) {
        return { success: true, data: data };
      });
    },

    defineSimplePropertyImplementation: function defineSimplePropertyImplementation(obj, name, func) {
      this._requestHandler.registerSimplePropertyImplementation(obj, name, func);
    },

    defineApiProperty: function defineApiProperty(name, Wrapper) {
      var factory = this;
      return this.definePropertyOrMethod('get', name, function (data) {
        var ret = new Wrapper(data, factory);

        return { success: true, data: ret };
      });
    },

    defineApiPropertyImplementation: function defineApiPropertyImplementation(obj, name, func) {
      this._requestHandler.registerApiPropertyImplementation(obj, name, func);
    },

    defineApiArrayProperty: function defineApiArrayProperty(name, Wrapper) {
      var factory = this;
      return this.definePropertyOrMethod('get', name, function (data) {
        var ret = _(data).map(function (d) {
          return new Wrapper(d, factory);
        });

        return { success: true, data: ret };
      });
    },

    defineApiArrayPropertyImplementation: function defineApiArrayPropertyImplementation(obj, name, func) {
      this._requestHandler.registerApiArrayPropertyImplementation(obj, name, func);
    },

    defineSimpleMethod: function defineSimpleMethod(name, options) {
      return this.definePropertyOrMethod('post', name, function (data) {
        return { success: true, data: data };
      }, options);
    },

    defineSimpleMethodImplementation: function defineSimpleMethodImplementation(obj, name, func) {
      this._requestHandler.registerSimpleMethodImplementation(obj, name, func);
    },

    defineApiMethod: function defineApiMethod(name, Wrapper) {
      var factory = this;
      return this.definePropertyOrMethod('post', name, function (data) {
        var ok = false;
        var ret;

        if (_(data).isString()) {
          ok = true;
          if (_(Wrapper).isFunction()) {
            ret = new Wrapper(data, factory);
          } else if (_(Wrapper).isObject()) {
            ret = new ApiObject(data, factory, Wrapper);
          }
        }

        return { success: ok, data: ret };
      });
    },

    defineEvent: function defineEvent() {
      var that = this;
      var addCommonListener = function addCommonListener(obj, name, commonListener) {
        var objectId = obj._api;
        obj.listenTo(that._eventDispatcher, EventDispatcher.eventId(objectId, name), commonListener);
      };

      var removeCommonListener = function removeCommonListener(obj) {
        obj.stopListening();
      };

      this._defineEventTemplate(arguments, addCommonListener, removeCommonListener);
    },

    defineEventTrigger: function defineEventTrigger(name) {
      var that = this;
      return function (data) {
        var message = {
          data: data,
          objectId: this._api,
          name: name
        };

        that.channel().sendEvent(message);
      };
    },

    defineLocalEventTrigger: function defineLocalEventTrigger(name) {
      var that = this;
      return function (data) {
        that._eventDispatcher.trigger(EventDispatcher.eventId(this._api, name), data);
      };
    },

    resetEvents: function resetEvents() {
      this._eventDispatcher.off();
    },

    _init: function _init(io, options) {
      if (_.isFunction(io.setVersion)) {
        io.setVersion(window.crmSdkVersion);
      }
      this._initChannel(io, options);
      this._eventDispatcher = new EventDispatcher(this.channel());
      this._requestHandler = new RequestHandler(this.channel());

      this.channel().onCommunicationError(this.bind(function () {
        this._eventDispatcher.off();
      }));

      this.channel().setRequestHandler(this._requestHandler);

      this._destructors.push(this.bind(function () {
        this._eventDispatcher.destroy();
        this._channel.destroy();
      }));
    },

    _initChannel: function _initChannel(io, options) {
      if (options && options.throttling) {
        this._channel = new ChannelThrottling(io, options);
      } else {
        this._channel = new Channel(io, options);
      }
    },

    _defineEventTemplate: function _defineEventTemplate(args, addCommonListener, removeCommonListener) {
      args = _(args).toArray();
      var obj = args.shift();
      var name = args.shift();
      var originalName = _(args[0]).isString() ? args.shift() : name;
      var factory = this;

      var commonListener = function commonListener() {
        var wrappers = _(args).clone();

        var rawEventArgs = _(arguments).toArray();
        var eventArgs = _(rawEventArgs).map(function (eventArg) {
          var Wrapper = wrappers.shift();
          return _(Wrapper).isUndefined() ? eventArg : new Wrapper(eventArg, factory);
        });

        var eventArgsStr = _(rawEventArgs).reduce(function (acc, eventArg) {
          return acc + ':' + eventArg;
        }, '');

        if (!_(eventArgs).isEmpty()) {
          obj.trigger.apply(obj, [name + eventArgsStr].concat(eventArgs));
        }

        obj.trigger.apply(obj, [originalName].concat(eventArgs));
      };

      obj._destructors.push(function () {
        removeCommonListener(obj, originalName, commonListener);
      });

      addCommonListener(obj, originalName, commonListener);
    },

    getState: function getState() {
      return this._channel.getState();
    }
  });

  return apiFactory;
});
//# sourceMappingURL=api-factory.js.map
;
define('msgbus/duplex-iframe-io',['underscore', 'msgbus/object', 'msgbus/events', 'msgbus/utils'], function (_, MsgBusObject, Events, Utils) {
  var DuplexIframeIO = MsgBusObject.extend({
    connect: function connect() {
      throw 'Abstract method';
    },
    send: function send(message) {
      var _this = this;

      if (_.isEmpty(this._ports)) {
        this._logError(this.getName(), ' native port is not connected yet');
        return;
      }

      var packedMsg = this._pack(message);
      _.each(this._ports, function (port, portId) {
        _this._logDebug('Send message to port:', portId);
        port.postMessage(packedMsg);
      });
    },
    onMessage: function onMessage(fn) {
      this.on('message', fn);
    },
    getName: function getName() {
      return this._name;
    },
    getVersion: function getVersion() {
      return this._version;
    },
    setVersion: function setVersion(version) {
      this._version = version;
    },
    _init: function _init(channelName) {
      this._name = Utils.randomId(channelName);
      this._iframeName = channelName;
      this._ports = {};
      this._channels = {};
      this._frames = {};
      this._clientsVersion = {};

      var disconnect = _.bind(this._disconnect, this);
      var originalBeforeUnload = window.onbeforeunload;
      window.onbeforeunload = function () {
        disconnect();

        if (originalBeforeUnload) {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return originalBeforeUnload.apply(this, args);
        }
      };
    },
    _pack: function _pack(message) {
      return {
        iframeName: this._iframeName,
        message: message,
        sender: this._name
      };
    },
    _triggerMessage: function _triggerMessage(msg) {
      this.trigger('message', msg);
    },
    _fromExpectedSource: function _fromExpectedSource(data) {
      return this._name !== data.sender && data.iframeName === this._iframeName;
    },
    _onPortDisconnected: function _onPortDisconnected(portId) {
      this._deletePort(portId);

      if (_.isEmpty(this._ports)) {
        this._logDebug(this.getName(), 'No active ports. Let the channel know.');
        this._triggerMessage(DuplexIframeIO.MESSAGE_DISCONNECT);
      }
    },


    // connectedMessage structure: connected:[<hostId>[:<io_name>:<version>]]
    _extractVersion: function _extractVersion(connectedMessage) {
      var parts = connectedMessage.split(':');
      if (parts.length === 4) {
        return parts[3] || 'latest';
      }
      return 'unknown';
    },

    _onPortMessage: function _onPortMessage(event) {
      var data = event.data;

      if (_.isObject(data) && this._fromExpectedSource(data)) {
        if (data.message === DuplexIframeIO.MESSAGE_DISCONNECT) {
          this._logDebug('Got disconnect request from: ', data.sender);
          this._onPortDisconnected(data.sender);
        } else {
          if (_.isString(data.message) && data.message.indexOf('connected:') === 0) {
            this._clientsVersion[data.sender] = this._extractVersion(data.message);
          }
          this._triggerMessage(data.message);
        }
      }
    },
    _onPortMessageError: function _onPortMessageError(error) {
      this._logError(this.getName(), ' native port error:', error);
    },
    _disconnect: function _disconnect() {
      var _this2 = this;

      if (_.isEmpty(this._ports)) {
        this._logError(this.getName(), ' native port is not connected yet');
        return;
      }

      var packedMsg = this._pack(DuplexIframeIO.MESSAGE_DISCONNECT);
      _.each(this._ports, function (port, portId) {
        _this2._logDebug('Send disconnect to port:', portId);
        port.postMessage(packedMsg);

        _this2._deletePort(portId);
      });
    },
    _deletePort: function _deletePort(portId) {
      if (this._ports[portId]) {
        this._ports[portId].close();

        delete this._ports[portId];
        delete this._channels[portId];
        delete this._frames[portId];
        delete this._clientsVersion[portId];
      }
    },


    _addModuleName: function _addModuleName() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      args.unshift('msgbus.js duplex-io [' + this.getName() + '] ');
      return args;
    },

    _logDebug: function _logDebug() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      console.debug.apply(console, this._addModuleName(args));
    },

    _logError: function _logError() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      console.error.apply(console, this._addModuleName(args));
    },

    getState: function getState() {
      return _.clone(this._clientsVersion);
    }

  }, {
    MESSAGE_CONNECT: 'connect',
    MESSAGE_ASKING_CONNECT: 'asking_connect',
    MESSAGE_DISCONNECT: 'disconnect'
  });

  DuplexIframeIO.mixin(Events);

  return DuplexIframeIO;
});
//# sourceMappingURL=duplex-iframe-io.js.map
;
define('msgbus/duplex-iframe-io-remote',['underscore', 'msgbus/duplex-iframe-io', 'msgbus/utils'], function (_, DuplexIo, Utils) {
  var DuplexIframeIO = DuplexIo.extend({
    connect: function connect() {
      this._logDebug('Start broadcast asking_connect');

      Utils.forEachIframe(this.bind(this._sendAskConnect));
    },
    _init: function _init(channelName) {
      this._super._init.call(this, channelName);
      this._name = 'remote_' + this._name;

      window.addEventListener('message', this.bind(this._onWindowMessage), false);
    },
    _onWindowMessage: function _onWindowMessage(event) {
      var data = event.data;

      if (_.isObject(data) && this._fromExpectedSource(data)) {
        if (data.message === DuplexIo.MESSAGE_CONNECT) {
          this._logDebug('Got incoming connect request: ', data.message);
          this._onConnect(event);
        }
      }
    },
    _onConnect: function _onConnect(event) {
      var _this = this;

      _.each(this._ports, function (port, portId) {
        _this._logDebug('Close existing port:', portId);
        _this._deletePort(portId);
      });

      if (event.ports && event.ports[0] && event.data.sender) {
        this._ports[event.data.sender] = event.ports[0];
        this._ports[event.data.sender].onmessage = this.bind(this._onPortMessage);
        this._ports[event.data.sender].onmessageerror = this.bind(this._onPortMessageError);
      }
      this._triggerMessage(DuplexIo.MESSAGE_CONNECT);
    },
    _sendAskConnect: function _sendAskConnect(targetWindow) {
      try {
        var data = this._pack(DuplexIo.MESSAGE_ASKING_CONNECT);
        targetWindow.postMessage(data, '*');
      } catch (err) {
        this._logDebug('Could not send ask connection message to', targetWindow, err);
      }
    }
  });

  return DuplexIframeIO;
});
//# sourceMappingURL=duplex-iframe-io-remote.js.map
;
define('msgbus/method-provider',['underscore'], function (_) {
  return {
    _methods: {},

    setMethod: function setMethod(name, func) {
      if (_.isFunction(func)) {
        this._methods[name] = func;
      } else {
        console.error('msgbus.js: ' + name + ' is not a function');
      }
    },
    getMethod: function getMethod(name) {
      return this._methods[name];
    },
    setMethods: function setMethods(object) {
      var _this = this;

      _.each(this.Methods, function (method) {
        if (_.isFunction(object[method])) {
          _this.setMethod(method, _.bind(object[method], object));
        }
      });
    }
  };
});
//# sourceMappingURL=method-provider.js.map
;
define('sdk.public/crm/interaction.api/interaction.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, Object, Events, MethodProvider) {
  /**
   * @class InteractionApi
   * @description Interaction API contains methods and event to track interaction lifecycle and get/set
   * some interaction data. Also some utility methods are provided.
   *
   * The interaction (call, chat, email) has a limited lifetime. When it is finished (disposition is set) the
   * interaction data (CAVs, disposition list, search results, Name/RelatedTo lists etc.) cleaned up.
   * It means the most of get/set methods won't work after you receive 'Call/Chat/EmailFinished' event (and inside
   * this event callback as well). It might be true for other events. For example, you implement callback
   * for CallEnded event and start long async action in it. When action is completed, call is already finished,
   * so get/set methods won't work.
   */

  /**
   * @typedef {object} InteractionApiErrorStatus
   * @property {ApiErrorCode} errorCode Error code
   * @property {string} [errorMessage] Error message
   */

  var InteractionApi = Object.extend({
    EventTriggers: {
      /**
       * @function click2dial
       * @memberof InteractionApi
       * @instance
       * @description Communicate to Five9 adapter that user pressed phone number and wants to initiate click to dial.
       * call will be started automatically if default campaign is configured by administrator or campaign name is provided
       * in click2dialData parameter.
       * ```
       * const interactionApi = window.Five9.CrmSdk.interactionApi();
       * interactionApi.click2dial({
       *   click2DialData: {
       *     clickToDialNumber: "9250000111",
       *     crmObject: {id: "789", label: "Account", name: "Umbrella", isWho: false, isWhat: true}
       *   }
       * });
       * ```
       * @param {object} params
       * @param {Click2DialData} params.click2DialData data associated with click 2 dial operation
       * @returns {void}
       */
      CLICK_TO_DIAL: 'click2dial',

      /**
       * @function objectVisited
       * @memberof InteractionApi
       * @instance
       * @description Communicate details of object visited by user in CRM system to Five9 Agent Desktop toolkit. Five9
       * adapter will display this object in the list of objects available for saving call logs.
       * ```
       * const interactionApi = window.Five9.CrmSdk.interactionApi();
       * interactionApi.objectVisited({
       *   crmObject: {id: "456", label: "Case", name: "Broken microwave", isWho: false, isWhat: true}
       * });
       * ```
       * @param {object} params
       * @param {CrmObject} params.crmObject data of visited CRM object
       * @returns {void}
       */
      OBJECT_VISITED: 'objectVisited'
    },

    Events: {
      InteractionEvent: 'interactionEvent',
      WebSocketEvent: 'webSocketEvent'
    },

    /**
     * @interface InteractionApiEvents
     */

    /**
     * @function callStarted
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when ADT starts handling new call
     * This event is also executed after every page refresh if ADT is handling call.
     * @param {object} params
     * @param {CallData} params.callData Call information
     * @returns {void}
     */

    /**
     * @function callFinished
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when ADT finished handling a call
     * It's called after a disposition was set and a call log is saved in a CRM system
     * (applicable when used with an adapter integrated with a CRM system). When this event is triggered
     * the interaction is already completed and the most of interaction data (CAVs, dispositions, search results etc.)
     * is unavailable, so related API methods will fail.
     * @param {object} params
     * @param {CallData} params.callData Call information
     * @param {CallLogData} params.callLogData Call log data
     * @returns {void}
     */

    /**
     * @function callAccepted
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when a call moves to TALKING, ON_HOLD or RINGING_ON_OTHER_SIDE states.
     * This event is executed only once for a call.
     * It is also executed after every page refresh right after callStarted event
     * if a call is in a one of the mentioned states.
     * @param {object} params
     * @param {CallData} params.callData Call information
     */

    /**
     * @function callEnded
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when call was ended either by agent or customer
     * but before it has been dispositioned
     * @param {object} params
     * @param {CallData} params.callData Call information
     */

    /**
     * @function callRejected
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when call was rejected by agent
     * @param {object} params
     * @param {CallData} params.callData Call information
     */

    /**
     * @function emailOffered
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when ADT starts handling new call
     * @param {object} params
     * @param {EmailData} params.emailData Email interaction information
     * @returns {void}
     */

    /**
     * @function emailFinished
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when a disposition (either open or close) was set.
     * It's called after a disposition was successfully set and an email log is saved in a CRM system
     * (applicable when used with an adapter integrated with a CRM system). When this event is triggered
     * the interaction is already completed and the most of interaction data (dispositions, search results etc.)
     * is unavailable, so related API methods will fail.
     * @param {object} params
     * @param {EmailData} params.emailData Email interaction information
     * @param {EmailLogData} params.emailLogData Email log data
     * @returns {void}
     */

    /**
     * @function emailAccepted
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when an email is locked by agent.
     * This event is executed after each page refresh right after emailOffered event.
     * @param {object} params
     * @param {EmailData} params.emailData Email interaction information
     * @returns {void}
     */

    /**
     * @function emailRejected
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when email was rejected by agent
     * @param {object} params
     * @param {EmailData} params.emailData Email interaction information
     * @returns {void}
     */

    /**
     * @function emailTransferred
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when email was transferred to another agent or skill.
     * It's also called when your unlock an email.
     * @param {object} params
     * @param {EmailData} params.emailData Email interaction information
     * @returns {void}
     */

    /**
     * @function chatOffered
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when ADT starts handling new call
     * @param {object} params
     * @param {ChatData} params.chatData Chat interaction information
     * @returns {void}
     */
    /**
     * @function chatFinished
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when a disposition (either open or close) was set.
     * It's called after a disposition was successfully set and a chat log is saved in a CRM system
     * (applicable when used with an adapter integrated with a CRM system). When this event is triggered
     * the interaction is already completed and the most of interaction data (dispositions, search results etc.)
     * is unavailable, so related API methods will fail.
     * @param {object} params
     * @param {ChatData} params.chatData Chat interaction information
     * @param {ChatLogData} params.chatLogData Chat log data
     * @returns {void}
     */
    /**
     * @function chatAccepted
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when a chat is locked by an agent or the agent is added to a conference.
     * This event is also executed after each page refresh.
     * @param {object} params
     * @param {ChatData} params.chatData Chat interaction information
     * @returns {void}
     */

    /**
     * @function chatEnded
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when call was ended either by agent or customer
     * and before it has been dispositioned
     * @param {object} params
     * @param {ChatData} params.chatData Chat interaction information
     * @returns {void}
     */

    /**
     * @function chatRejected
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when chat was rejected by agent
     * @param {object} params
     * @param {ChatData} params.chatData Chat interaction information
     * @returns {void}
     */

    /**
     * @function chatTransferred
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when chat was transferred to another agent or skill
     * @param {object} params
     * @param {ChatData} params.chatData Chat interaction information
     * @returns {void}
     */

    /**
     * @function objectSelected
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when CRM object was selected by agent in Name/RelatedTo list
     * @param {object} params
     * @param {CrmObject|undefined} params.crmObject Selected CRM object or 'undefined' if 'None' is selected
     * @param {InteractionType} params.interactionType Type of interaction
     * @param {CallData|ChatData|EmailData} params.interactionData Five9 Interaction data
     * @returns {void}
     */

    /**
     * @function subscribe
     * @memberof InteractionApi
     * @instance
     * @description Subscribes to Interaction Api events.
     *```
     * const interactionApi = window.Five9.CrmSdk.interactionApi();
     * interactionApi.subscribe({
     *     callStarted: function (params) {
     *     },
     *     callFinished: function (params) {
     *     },
     *     callAccepted: function (params) {
     *     },
     *     callRejected: function (params) {
     *     },
     *     callEnded: function (params) {
     *     },
     *     emailOffered: function (params) {
     *     },
     *     emailAccepted: function (params) {
     *     },
     *     emailRejected: function (params) {
     *     },
     *     emailTransferred: function (params) {
     *     },
     *     emailFinished: function (params) {
     *     },
     *     chatOffered: function (params) {
     *     },
     *     chatAccepted: function (params) {
     *     },
     *     chatRejected: function (params) {
     *     },
     *     chatTransferred: function (params) {
     *     },
     *     chatEnded: function (params) {
     *     },
     *     chatFinished: function (params) {
     *     },
     *     objectSelected: function (params) {
     *     }
     * });
     *```
     * @param {InteractionApiEvents} apiEvents Callbacks corresponding to the events will be called on object passed as parameter
     * @returns {void}
     */

    Apis: {
      /**
       * @function setCav
       * @memberof InteractionApi
       * @instance
       * @description Sets value of call attached variables
       * ```
       * interactionApi.setCav({
       *   interactionId: "45E471D607A94072A553A1406CC0BF03",
       *   cavList: [
       *     {id: "641", value: "test value"},
       *     {id:"219", value: "test@example.com"}
       *   ]
       * });
       * ```
       * @param {object} params Parameters
       * @param {string} params.interactionId Five9 Call Id (see {@link CallData})
       * @param {object[]} params.cavList list of call attached variables to update
       * @param {string} params.cavList[].id ID of call attached variable
       * @param {string} params.cavList[].value New value of call attached variable
       * @returns {Promise} Promise is resolved if Five9 REST API call succeeded.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      SetCav: 'setCav',

      /**
       * @function getCav
       * @memberof InteractionApi
       * @instance
       * @description Retrieves list of call attached variables
       * ```
       * interactionApi.subscribe({
       *   callStarted: params => {
       *     interactionApi.getCav({interactionId: params.callData.interactionId})
       *       .then(cavList => {
       *         console.debug('Interaction API got cavList: ' + JSON.stringify(cavList));
       *       });
       *   }
       * });
       * ```
       * @param {object} params Parameters
       * @param {string} params.interactionId Five9 Call Id (see {@link CallData})
       * @returns {Promise} Promise object represents {@link Cav}[]
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      GetCav: 'getCav',

      /**
       * @function setDisposition
       * @memberof InteractionApi
       * @instance
       * @description Sets  disposition for current call
       *```
       * interactionApi.setDisposition({
       *   interactionType: 'Call',
       *   interactionId: "92544E7EFD1B4858A93C54092CB51886",
       *   dispositionId: "3558"
       * });
       *```
       * @param {object} params
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @param {string} params.dispositionId Disposition Id
       * @param {string} [params.timeout] Value of the timer, which applies only when the disposition is REDIAL or DND.
       * When setting the disposition, the agent may change the value if the disposition has either of these flags:
       * - ALLOW_SET_REACTIVATE_TIMER
       * - ALLOW_SET_REDIAL_TIMER
       * @returns {Promise} Promise is resolved if Five9 REST API call succeeded.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      SetDisposition: 'setDisposition',

      /**
       * @function getDispositions
       * @memberof InteractionApi
       * @instance
       * @description Retrieves list of dispositions for specified interaction
       * ```
       * interactionApi.subscribe({
       *   callStarted: params => {
       *     interactionApi.getDispositions({interactionType: 'Call', interactionId: params.callData.interactionId})
       *       .then(dispositionList => {
       *         console.debug('Interaction API got dispositionList: ' + JSON.stringify(dispositionList));
       *       });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @returns {Promise} Promise object represents {@link Disposition}[]
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      GetDispositions: 'getDispositions',

      /**
       * @function getSearchResults
       * @memberof InteractionApi
       * @instance
       * @description Retrieves list of CRM objects found by search
       * ```
       * interactionApi.subscribe({
       *   callEnded: params => {
       *     interactionApi.getSearchResults({
       *       interactionType: params.interactionType,
       *       interactionId: params.interactionData.interactionId
       *     }).then(searchResults => {
       *       console.debug('Interaction API got searchResults: ' + JSON.stringify(searchResults));
       *     });
       *   }
       * });
       * ```
       * @param {object} params Parameters
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @returns {Promise} Promise object represents {@link CrmObject}[]
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      GetSearchResults: 'getSearchResults',

      /**
       * @function getNameObjects
       * @memberof InteractionApi
       * @instance
       * @description Retrieves list of visited 'Name' CRM objects for specified interaction
       * ```
       * interactionApi.subscribe({
       *   objectSelected: params => {
       *     interactionApi.getNameObjects({
       *       interactionType: params.interactionType,
       *       interactionId: params.interactionData.interactionId
       *     }).then(objects => {
       *       console.debug('Interaction API got name objects: ' + JSON.stringify(objects));
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @returns {Promise} Promise object represents {@link CrmObject}[]
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      GetNameObjects: 'getNameObjects',

      /**
       * @function getRelatedToObjects
       * @memberof InteractionApi
       * @instance
       * @description Retrieves list of visited 'Related To' CRM objects for specified interaction
       * ```
       * interactionApi.subscribe({
       *   objectSelected: params => {
       *     interactionApi.getRelatedToObjects({
       *       interactionType: params.interactionType,
       *       interactionId: params.interactionData.interactionId
       *     }).then(objects => {
       *       console.debug('Interaction API got related to objects: ' + JSON.stringify(objects));
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @returns {Promise} Promise object represents {@link CrmObject}[]
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      GetRelatedToObjects: 'getRelatedToObjects',

      /**
       * @function getSelectedNameObject
       * @memberof InteractionApi
       * @instance
       * @description Retrieves selected 'Name' CRM object for specified interaction
       * ```
       * interactionApi.subscribe({
       *   callEnded: params => {
       *     interactionApi.getSelectedNameObject({
       *       interactionType: params.interactionType,
       *       interactionId: params.interactionData.interactionId
       *     }).then(nameObject => {
       *       console.debug('Interaction API got selected name object: ' + JSON.stringify(nameObject));
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @returns {Promise} Promise object represents {@link CrmObject} or nothing if 'None' is selected.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      GetSelectedNameObject: 'getSelectedNameObject',

      /**
       * @function getSelectedRelatedToObject
       * @memberof InteractionApi
       * @instance
       * @description Retrieves selected 'Related To' CRM object for specified interaction
       * ```
       * interactionApi.subscribe({
       *   callEnded: params => {
       *     interactionApi.getSelectedRelatedToObject({
       *       interactionType: params.interactionType,
       *       interactionId: params.interactionData.interactionId
       *     }).then(relatedToObject => {
       *       console.debug('Interaction API got selected related to object: ' + JSON.stringify(relatedToObject));
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @returns {Promise} Promise object represents {@link CrmObject} or nothing if 'None' is selected.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      GetSelectedRelatedToObject: 'getSelectedRelatedToObject',

      /**
       * @function selectNameObject
       * @memberof InteractionApi
       * @instance
       * @description Sets selected 'Name' CRM object for specified interaction
       * ```
       * interactionApi.subscribe({
       *   callEnded: params => {
       *     interactionApi.selectNameObject({
       *       interactionType: params.interactionType,
       *       interactionId: params.interactionData.interactionId,
       *       objectId: '123'
       *     }).then(() => {
       *       console.debug('Interaction API set selected name object');
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @param {string|null} params.objectId CRM object id to select. Pass null if you want to select 'None'.
       * 'None' cannot be set in some cases (it depends on settings).
       * @returns {Promise} Promise is resolved if object is selected.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      SelectNameObject: 'selectNameObject',

      /**
       * @function selectRelatedToObject
       * @memberof InteractionApi
       * @instance
       * @description Sets selected 'Related To' CRM object for specified interaction
       * ```
       * interactionApi.subscribe({
       *   callEnded: params => {
       *     interactionApi.selectRelatedToObject({
       *       interactionType: params.interactionType,
       *       interactionId: params.interactionData.interactionId,
       *       objectId: '123'
       *     }).then(() => {
       *       console.debug('Interaction API set selected related to object');
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Type of interaction
       * @param {string} params.interactionId Five9 Interaction Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
       * @param {string|null} params.objectId CRM object id to select. Pass null if you want to select 'None'.
       * 'None' cannot be set in some cases (it depends on settings).
       * @returns {Promise} Promise is resolved if object is selected.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      SelectRelatedToObject: 'selectRelatedToObject',

      /**
       * @function sendDtmf
       * @memberof InteractionApi
       * @instance
       * @description Send DTMF to softphone.
       * @param {string} params.char A string containing DTMF digits.
       * @returns {Promise} Promise is resolved if DTMF send is successful.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      SendDtmf: 'sendDtmf',

      /**
       * @function mute
       * @memberof InteractionApi
       * @instance
       * @description Mute softphone.
       * @returns {Promise} Promise is resolved if mute is successful.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      Mute: 'mute',

      /**
       * @function unMute
       * @memberof InteractionApi
       * @instance
       * @description Unmute softphone.
       * @returns {Promise} Promise is resolved if unmute is successful.
       * In case of error Promise is rejected and {@link InteractionApiErrorStatus} is returned.
       */
      Unmute: 'unmute',

      /**
       * @function isMasterPage
       * @memberof InteractionApi
       * @instance
       * @description Determines if this page contains ADT instance which holds websocket connection
       * @returns {Promise} Promise object represents boolean value
       */
      IsMasterPage: 'isMasterPage',

      /**
       * These API are private and not public available
       */
      GetApplicationContext: 'getApplicationContext',

      UpdateWebSocketSubscriptions: 'updateWebSocketSubscriptions'
    },

    _init: function _init(apiFactory) {
      var _this = this;

      this._api = 'interactionApi';
      this._apiFactory = apiFactory;

      // Define Event triggers
      _.each(this.EventTriggers, function (name) {
        _this[name] = apiFactory.defineEventTrigger(name);
      });

      // Define Events
      _.each(this.Events, function (name) {
        apiFactory.defineEvent(_this, name);
      });

      // Define Apis
      _.each(this.Apis, function (method) {
        _this[method] = apiFactory.defineSimpleMethod(method);
      });

      this._destructors.push(this.bind(this.off));
    },
    setOnConnectCallback: function setOnConnectCallback(callback) {
      this._apiFactory.channel().setOnConnectCallback(function () {
        callback();
      });
    }
  });

  InteractionApi.mixin(Events);
  InteractionApi.mixin(MethodProvider);

  return InteractionApi;
});
//# sourceMappingURL=interaction.api.js.map
;
define('sdk.public/generic.public.api',['underscore'], function (_) {
  var PublicApi = function PublicApi(api) {
    if (_.isObject(api.Events)) {
      this.subscribe = function (name, func) {
        if (_.isObject(name)) {
          var callbacks = name;
          _.each(callbacks, function (func, name) {
            api.on(name, function (data) {
              func.call(callbacks, data);
            });
          });
        } else {
          api.on(name, function (data) {
            func.call(null, data);
          });
        }
      };

      this.unsubscribe = function (name, func) {
        if (_.isObject(name)) {
          var callbacks = name;
          _.each(callbacks, function (func, name) {
            api.off(name, function (data) {
              func.call(callbacks, data);
            });
          });
        } else {
          api.off(name, function (data) {
            func.call(null, data);
          });
        }
      };
    }

    if (_.isObject(api.Methods)) {
      this.registerApi = function (name, func) {
        if (_.isObject(name)) {
          var methods = name;
          api.setMethods(methods);
        } else {
          api.setMethod(name, func);
        }
      };
    }

    var apiPublicProperties = ['Events', 'Methods', _.values(api.EventTriggers), _.values(api.Apis)];
    var publicProperties = _.chain(apiPublicProperties).flatten().compact().filter(function (propertyName) {
      return !!api[propertyName];
    }).map(function (propertyName) {
      var value = void 0;
      if (_.isFunction(api[propertyName])) {
        value = function value(data) {
          var ret = api[propertyName](data);
          if (ret && _.isFunction(ret.then)) {
            return Promise.resolve(ret);
          } else {
            return ret;
          }
        };
      } else {
        value = api[propertyName];
      }
      return [propertyName, value];
    }).object().value();
    _.extend(this, publicProperties);
  };

  return PublicApi;
});
//# sourceMappingURL=generic.public.api.js.map
;
define('api/sdk/interaction/interaction.event.reason',[], function () {

  return {
    // Call events
    CallStarted: 'callStarted',
    CallAccepted: 'callAccepted',
    CallRejected: 'callRejected',
    CallEnded: 'callEnded',
    CallFinished: 'callFinished',

    // Email events
    EmailOffered: 'emailOffered',
    EmailAccepted: 'emailAccepted',
    EmailRejected: 'emailRejected',
    EmailTransferred: 'emailTransferred',
    EmailFinished: 'emailFinished',

    // Chat events
    ChatOffered: 'chatOffered',
    ChatAccepted: 'chatAccepted',
    ChatRejected: 'chatRejected',
    ChatEnded: 'chatEnded',
    ChatTransferred: 'chatTransferred',
    ChatFinished: 'chatFinished',

    // Other events
    ObjectSelected: 'objectSelected'
  };
});
//# sourceMappingURL=interaction.event.reason.js.map
;
define('sdk.public/crm/interaction.api/interaction.api.rest',['underscore'], function (_) {
  var restToFreedom = {
    executeRest: function executeRest(config, params) {
      if (!params) {
        return Promise.reject({ error: 'Rest parameters are empty' });
      }

      if (!this._checkPath(params.path)) {
        return Promise.reject({ error: 'Wrong request path' });
      }

      var method = params.method || 'GET';
      if (!this._checkMethod(method)) {
        return Promise.reject({ error: 'Wrong request method' });
      }

      var headers = Object.assign({}, params.headers);
      var headerContentTypeFieldName = Object.keys(headers).find(function (key) {
        return key.toLowerCase() === 'content-type';
      });
      headerContentTypeFieldName = headerContentTypeFieldName || 'Content-Type';

      if (!headers[headerContentTypeFieldName]) {
        if (_.isString(params.contentType)) {
          headers[headerContentTypeFieldName] = params.contentType;
        } else if (params.contentType === undefined) {
          headers[headerContentTypeFieldName] = 'application/json';
        } else if (params.contentType === false) {
          // Don't set a content type - rely on XMLHttpRequest implementation
        } else {
          return Promise.reject({ error: 'Wrong request method' });
        }
      }

      return this._makeRequest(method, config.apiBaseURL + params.path, headers, params.payload);
    },


    _checkPath: function _checkPath(path) {
      return !!path && path.startsWith('/');
    },

    _checkMethod: function _checkMethod(method) {
      return method === 'GET' || method === 'PUT' || method === 'POST' || method === 'DELETE' || method === 'PATCH'; //NOSONAR
    },

    _makeRequest: function _makeRequest(method, url, headers, data) {
      return new Promise(function (resolve) {
        var req = new XMLHttpRequest();
        req.open(method, url, true);
        req.withCredentials = true;

        Object.keys(headers).forEach(function (key) {
          return req.setRequestHeader(key, headers[key]);
        });

        req.onreadystatechange = function () {
          if (this.readyState === 4 /* complete */) {
              req.onreadystatechange = null;
              resolve({ status: this.status, response: this.response });
            }
        };
        if (data) {
          req.send(data);
        } else {
          req.send();
        }
      });
    }
  };

  return restToFreedom;
});
//# sourceMappingURL=interaction.api.rest.js.map
;
define('sdk.public/crm/interaction.api/interaction.api.ws.events',['underscore'], function (_) {
  var webSocketSubscriptions = {};

  var wsEventsApi = {
    subscribe: function subscribe(arg1, arg2) {
      var addSubscription = function addSubscription(wsId, callback) {
        webSocketSubscriptions[wsId] = webSocketSubscriptions[wsId] || [];
        webSocketSubscriptions[wsId].push(callback);
      };

      if (_.isObject(arg1)) {
        var object = arg1;
        Object.keys(object).forEach(function (wsId) {
          addSubscription(wsId, object[wsId]);
        });
      } else {
        var wsId = arg1;
        var callback = arg2;
        addSubscription(wsId, callback);
      }
    },

    unsubscribe: function unsubscribe(arg1, arg2) {
      var removeSubscription = function removeSubscription(id, callback) {
        if (webSocketSubscriptions[id]) {
          webSocketSubscriptions[id] = webSocketSubscriptions[id].filter(function (e) {
            return e !== callback;
          });

          if (webSocketSubscriptions[id].length === 0) {
            delete webSocketSubscriptions[id];
          }
        }
      };

      if (_.isObject(arg1)) {
        var object = arg1;
        Object.keys(object).forEach(function (wsId) {
          removeSubscription(wsId, object[wsId]);
        });
      } else {
        var wsId = arg1;
        var callback = arg2;
        removeSubscription(wsId, callback);
      }
    },

    eventHandler: function eventHandler(params) {
      if (webSocketSubscriptions[params.id]) {
        webSocketSubscriptions[params.id].forEach(function (callback) {
          try {
            callback(params.payload, params.context);
          } catch (ex) {
            // eslint-disable-next-line no-console
            console.error(ex);
          }
        });
      }
    },

    hasNoSubscriptions: function hasNoSubscriptions() {
      return Object.keys(webSocketSubscriptions).length === 0;
    },

    getSubscriptions: function getSubscriptions() {
      return Object.keys(webSocketSubscriptions);
    }
  };

  return wsEventsApi;
});
//# sourceMappingURL=interaction.api.ws.events.js.map
;
define('sdk.public/crm/interaction.api/interaction.public.api',['underscore', 'sdk.public/generic.public.api', 'api/sdk/interaction/interaction.event.reason', 'sdk.public/crm/interaction.api/interaction.api.rest', 'sdk.public/crm/interaction.api/interaction.api.ws.events'], function (_, PublicApi, InteractionEventReason, InteractionApiRest, InteractionApiWsEvents) {
  var InteractionPublicApi = function InteractionPublicApi(api) {
    PublicApi.call(this, api);

    // Override subscribe function
    this.subscribe = function (arg1, arg2) {
      if (_.isObject(arg1)) {
        var object = arg1;
        api.on(api.Events.InteractionEvent, function (params) {
          var callbackName = params.reason;
          if (_.isFunction(object[callbackName])) {
            object[callbackName].call(object, params.payload);
          } else {
            // eslint-disable-next-line no-console
            console.error(callbackName + ' is not implemented');
          }
        });
      } else {
        var eventName = arg1;
        var callback = arg2;
        api.on(api.Events.InteractionEvent, function (params) {
          if (params.reason === eventName) {
            callback(params.payload);
          }
        });
      }
    };

    /**
     * @function executeRestApi
     * @memberof InteractionApi
     * @instance
     * @description Executes REST request using CORS
     * ```
     * interactionApi.executeRestApi({path: '/appsvcs/rs/svc/orgs/1/dispositions', method: 'GET', payload: null}).then(function (result) {
     *   // resolve handler
     * }, function (result) {
     *   // reject handler
     * });
     * ```
     * @param {object} params Parameters
     * @param {string} params.path Request path for REST call
     * @param {string} params.method Request method, e.g. 'GET', 'POST', 'PUT', 'DELETE'. Default value is 'GET'
     * @param {object} params.contentType Type of payload content. If not provided, { 'Content-Type': 'application/json' } will be used, if false, no content type will be set and browser will try to set it automatically
     * @param {object} params.headers JSON data object containing headers of the request. If 'Content-Type' is defined the contentType flag is igonred
     * @param {object} params.payload JSON data object passed in the body of the request
     * @returns {Promise} Promise objects represents {status: <e.g. 200, 404, ...>, response: <response data>} or {error: 'Error description'}[]
     */
    this.executeRestApi = function (params) {
      return new Promise(function (resolve, reject) {
        api.getApplicationContext().then(function (config) {
          return InteractionApiRest.executeRest(config, params).then(function (result) {
            return resolve(result);
          }, function (result) {
            return reject(result);
          });
        }, function (error) {
          return reject({ error: 'Cannot get config from adapter: ' + error });
        });
      });
    };

    /**
     * @function subscribeWsEvent
     * @memberof InteractionApi
     * @instance
     * @description Subscribes to web socket events.
     * ```
     * interactionApi.subscribeWsEvent({
     *     "29": function (params, context) {
     *     },
     *     "15": function (params, context) {
     *     },
     *     ...
     * });
     *
     * alternative subscription:
     *
     * interactionApi.subscribeWsEvent("29", function (params) {
     * });
     *```
     * @param {string | object} wsEventId Callbacks corresponding to the web socket events will be called on object passed as parameter
     * @returns {void}
     */
    this.subscribeWsEvent = function () {
      if (InteractionApiWsEvents.hasNoSubscriptions()) {
        api.on(api.Events.WebSocketEvent, InteractionApiWsEvents.eventHandler);
      }

      InteractionApiWsEvents.subscribe.apply(InteractionApiWsEvents, arguments);

      api.updateWebSocketSubscriptions(InteractionApiWsEvents.getSubscriptions());
    };

    /**
     * @function unsubscribeWsEvent
     * @memberof InteractionApi
     * @instance
     * @description Unsubscribes from web socket events.
     * ```
     * interactionApi.unsubscribeWsEvent({
     *     "29": <function used for subscription>,
     *     "15": <function used for subscription>,
     *     ...
     * });
     *
     * alternative unsubscription:
     *
     * interactionApi.unsubscribeWsEvent("29", <function used for subscription>);
     *```
     * @param {string | object} wsEventId Callback references used for subscription to web socket events will be unsubscribed from those events
     * @returns {void}
     */
    this.unsubscribeWsEvent = function () {
      InteractionApiWsEvents.unsubscribe.apply(InteractionApiWsEvents, arguments);

      if (InteractionApiWsEvents.hasNoSubscriptions()) {
        api.off(api.Events.WebSocketEvent, InteractionApiWsEvents.eventHandler);
      }

      api.updateWebSocketSubscriptions(InteractionApiWsEvents.getSubscriptions());
    };

    /**
     * @function getMetadata
     * @memberof InteractionApi
     * @instance
     * @description Retrieves of agent and tenant ids
     * @returns {Promise} that's always resolved and return object represents {agentId: Number, tenantId: Number}
     */
    this.getMetadata = function () {
      return new Promise(function (resolve, reject) {
        api.getApplicationContext().then(function (config) {
          return resolve({ agentId: config.agentId, tenantId: config.tenantId });
        }, function (error) {
          return reject({ error: 'Cannot get metadata from adapter: ' + error });
        });
      });
    };

    api.setOnConnectCallback(function () {
      api.updateWebSocketSubscriptions(InteractionApiWsEvents.getSubscriptions());
    });

    //Do not expose these APIs
    delete this.getApplicationContext;
    delete this.updateWebSocketSubscriptions;

    // Override Events object
    this.Events = _.chain(_.values(InteractionEventReason)).map(function (event) {
      return [event, event];
    }).object().value();
  };

  return InteractionPublicApi;
});
//# sourceMappingURL=interaction.public.api.js.map
;
define('sdk.public/crm/interaction.api/interaction.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/interaction.api/interaction.api', 'sdk.public/crm/interaction.api/interaction.public.api'], function (_, ApiFactory, IFrameIO, InteractionApi, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var interactionApis = {};

  function createInteractionApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(interactionApis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('intrx_plugin_' + name), apiFactoryOptions);
      var interactionApi = new InteractionApi(factory);
      interactionApis[name] = new PublicApi(interactionApi);
    }

    return interactionApis[name];
  }

  return createInteractionApi;
});
//# sourceMappingURL=interaction.api.factory.js.map
;
define('sdk.public/crm/custom.components.api/components.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, Object, Events, MethodProvider) {
  var Api = Object.extend({
    Events: {
      ComponentEvent: 'componentEvent'
    },

    Methods: {
      GetCustomComponents: 'getCustomComponents'
    },

    _init: function _init(apiFactory) {
      this._api = 'customComponentsApi';

      apiFactory.addMethodProvider(this);

      apiFactory.defineSimpleMethodImplementation(this, this.Methods.GetCustomComponents);

      apiFactory.defineEvent(this, this.Events.ComponentEvent);

      this._destructors.push(this.bind(this.off));
    }
  });

  Api.mixin(Events);
  Api.mixin(MethodProvider);

  return Api;
});
//# sourceMappingURL=components.api.js.map
;
define('sdk.public/crm/custom.components.api/components.public.api',['underscore', 'sdk.public/generic.public.api'], function (_, PublicApi) {
  /**
   * @class CustomComponentsApi
   */
  var ComponentsPublicApi = function ComponentsPublicApi(api) {
    PublicApi.call(this, api);
    /**
     * @function registerCustomComponents
     * @memberof CustomComponentsApi
     * @instance
     * @description Registers template for custom components and callbacks that should be executed on component events
     * refer to {@tutorial customcomponents} for template specification
     * @param {object} params
     * @param {string} params.template Markdown for custom components
     * @param {object} params.callbacks Map of functions representing callbacks defined in the custom component template.
     * These functions will be executed when corresponding UI controls are changed or clicked. Function takes an object:
     * - name {string} Name of the UI element
     * - value {string} Value of the input element
     * - interactionType {InteractionType} Type of interaction
     * - interactionData {CallData|ChatData|EmailData} Five9 Interaction data
     * @returns {void} 
     */
    this.registerCustomComponents = function (params) {
      if (params && params.template) {
        api.setMethod(api.Methods.GetCustomComponents, function () {
          return params.template;
        });

        if (!_.isEmpty(params.callbacks)) {
          api.on(api.Events.ComponentEvent, function (event) {
            if (_.isFunction(params.callbacks[event.callbackName])) {
              params.callbacks[event.callbackName].call(params.callbacks, event.payload);
            } else {
              // eslint-disable-next-line no-console
              console.error(event.callbackName + ' is not implemented');
            }
          });
        }
      }
    };
  };

  return ComponentsPublicApi;
});
//# sourceMappingURL=components.public.api.js.map
;
define('sdk.public/crm/custom.components.api/components.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/custom.components.api/components.api', 'sdk.public/crm/custom.components.api/components.public.api'], function (_, ApiFactory, IFrameIO, Api, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var apis = {};

  function createApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(apis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('cust_comp_plugin_' + name), apiFactoryOptions);
      var api = new Api(factory);
      apis[name] = new PublicApi(api);
    }

    return apis[name];
  }

  return createApi;
});
//# sourceMappingURL=components.api.factory.js.map
;
define('sdk.public/crm/crm.api/crm.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, Object, Events, MethodProvider) {

  /**
    * @class CrmApi
    */

  /**
  * @typedef {Object} AdtConfig
  * @property {string} providerName  Name of the integration provider. Will be displayed on the login screen.
  * @property {boolean} myCallsTodayEnabled  Flag to define if My Calls Today button should be shown on home screen
  * @property {boolean} myChatsTodayEnabled  Flag to define if My Chats Today button should be shown on home screen
  * @property {boolean} myEmailsTodayEnabled  Flag to define if My Emails Today button should be shown on home screen
  * @property {boolean} showContactInfo Flag to define if VCC contact fields should be shown on Five9 Adapter search panel
  * per profile configuration in VCC
  * @property {string} guideLink Link to the agent guide for adapter. Points to Five9 ADT agent guide by default.
  */

  /**
  * @typedef {Object} SearchResult
  * @property {CrmObject[]} crmObjects List of found CRM objects
  * @property {CrmObject} screenPopObject CRM object that should be used for screen pop
  */

  var Api = Object.extend({

    /**
    * @function registerApi
    * @memberof CrmApi
    * @instance
    * @description Registers implementation of callbacks integrating ADT with CRM system. See example in {@tutorial basicintegration}
    * @param {CrmApiCallbacks} object with properties corresponding to callbacks you would like to implement
    * @returns {void}
    */

    EventTriggers: {
      /**
       * @function objectVisited
       * @memberof CrmApi
       * @instance
       * @description Communicate details of object visited by user in CRM system to Five9 Agent Desktop toolkit. Five9 adapter will
       * display this object in the list of objects available for saving call logs.
       * ```
       * crmApi.objectVisited({crmObject: {id: "456", type: "Case", label: "Case", name: "Broken microwave", isWho: false, isWhat: true}});
       * ```
       * @param {object} params
       * @param {CrmObject} params.crmObject data of visited CRM object
       * @returns {void}
       */
      CRM_OBJECT_VISITED: 'objectVisited',

      /**
       * @function click2dial
       * @memberof CrmApi
       * @instance
       * @description Communicate to Five9 adapter that user pressed phone number and wants to initiate click to dial.
       * call will be started automatically if default campaign is configured by administrator or campaign name is provided
       * in click2DialData parameter.
       * ```
       * crmApi.click2dial({click2DialData: {clickToDialNumber: "9250000111", crmObject: {id: "789", type: "Account", label: "Account", name: "XYZ", isWho: false, isWhat: true}}});
       * ```
       * @param {object} params
       * @param {Click2DialData} params.click2DialData data associated with click 2 dial operation
       * @returns {void}
       */
      CRM_CLICK_2_DIAL: 'click2dial',

      /**
       * @function suggestedNumbers
       * @memberof CrmApi
       * @instance
       * @description Communicate to Five9 adapter that user navigated to object with phone numbers and those numbers need to
       * be displayed in the list of suggested numbers if agent navigates to make call screen.
       * ```
       * crmApi.suggestedNumbers({suggestedNumbers: [
       *  {clickToDialNumber:"9250000111", crmObject: {id: "441", type: "Case", label: "Case", name: "Engine broken", isWho: false, isWhat: true}},
       *  {clickToDialNumber:"9250000112", crmObject: {id: "789", type: "Account", label: "Account", name: "XYZ", isWho: false, isWhat: true}},
       *  {clickToDialNumber:"9250000113", crmObject: {id: "731", type: "Contact", label: "Contact", name: "Tim", isWho: true, isWhat: false}}]});
       * ```
       * @param {object} params objects and configuration that will be used to populate suggested numbers menu
       * @param {Click2DialData[]} params.suggestedNumbers list of objects
       * @returns {void}
       */
      CRM_SUGGESTED_NUMBERS: 'suggestedNumbers'
    },

    /**
     * @interface CrmApiCallbacks
     */

    Methods: {
      /**
       * @function bringAppToFront
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to bring Five9 ADT iframe to front and make it visible
       * @returns {void}
       */
      BringAppToFront: 'bringAppToFront',

      /**
       * @function getTodayCallsCount
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to populate value of today's call count tile in Five9 ADT
       * ```
       * crmApi.registerApi({
       *     getTodayCallsCount: function (params) {
       *      return Promise.resolve(77);
       *  }});
       * ```
       * @returns {Promise(number)} Promise object represents number of today's calls.
       */
      GetTodayCallsCount: 'getTodayCallsCount',

      /**
       * @function getTodayChatsCount
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to populate value of today's chat count tile in Five9 ADT
       * @returns {Promise(number)} Promise object represents number of today's chats.
       */
      GetTodayChatsCount: 'getTodayChatsCount',
      /**
       * @function getTodayEmailsCount
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to populate value of today's email count tile in Five9 ADT
       * @returns {Promise(number)} Promise object represents number of today's emails.
       */
      GetTodayEmailsCount: 'getTodayEmailsCount',

      /**
       * @function saveLog
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to save interaction (Call, Email, Chat) log in CRM system for CRM object
       * selected in ADT and using comments entered by user in ADT. Executed when agent sets interaction disposition in Five9 Adapter.
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @param {CallLogData | ChatLogData | EmailLogData} params.interactionLogData Interaction log data
       * @returns {Promise(any)} Promise object
       */
      SaveLog: 'saveLog',
      /**
       * @function openMyCallsToday
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to open my calls today report when user clicks on 'Calls' tile in ADT.
       * @returns {void}
       */
      OpenMyCallsToday: 'openMyCallsToday',

      /**
       * @function openMyChatsToday
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to open my calls today report when user clicks on 'Chats' tile in ADT.
       * @returns {void}
       */
      OpenMyChatsToday: 'openMyChatsToday',
      /**
       * @function openMyChatsToday
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to open my calls today report when user clicks on 'Emails' tile in ADT.
       * @returns {void}
       */
      OpenMyEmailsToday: 'openMyEmailsToday',

      /**
       * @function screenPop
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to execute screen pop to the CRM object. ADT will execute this call back
       * in case {@link SearchResult} result returned by search method contains only one object or screenPopObject attribute of {@link SearchResult} is not empty.
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @param {CrmObject} params.crmObject Object selected for screen pop. Can be executed either because single matching result
       * was identified during search or because agent clicked one of the multiple search results in Five9 Adapter
       * @param {boolean} [params.force] Do force screen pop (if supported by CRM)
       * @returns {void}
       */
      ScreenPop: 'screenPop',

      /**
       * @function enableClickToDial
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to enable click 2 dial capability in CRM while agent is not handling call in ADT
       * @returns {void}
       */
      EnableClickToDial: 'enableClickToDial',

      /**
       * @function disableClickToDial
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to disable click 2 dial capability in CRM while agent is handling call in ADT
       * @returns {void}
       */
      DisableClickToDial: 'disableClickToDial',

      /**
       * @function search
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to search for CRM objects based on phone number and Call attached variables associated
       * with call being handled in ADT
       * ```
       * crmApi.registerApi({
       *  search: function (params) {
       *           var crmObjects = [{id: "123", type: "Contact", label: "Contact", name: "Joe", isWho: true, isWhat: false, fields:[{displayName: "Company", value: "ABC"}]}];
       *           return Promise.resolve({crmObjects: crmObjects, screenPopObject: crmObjects[0]});
       *       }});
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction information
       * @param {CallSearchData | ChatSearchData | EmailSearchData} params.interactionSearchData Additional data. Used only when interaction type is 'Call' or 'Chat'
       * @returns {Promise}  Promise represents {@link SearchResult}
       */
      Search: 'search',

      /**
       * @function getAdtConfig
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to configure behavior of ADT. This method is called only once when ADT establishes connection
       * with CrmSdk
       * ```
       * crmApi.registerApi({
       *   getAdtConfig: () => {
       *     const config = {
       *       providerName: 'Demo CRM ADT adapter',
       *       myCallsTodayEnabled: true,
       *       myChatsTodayEnabled: true,
       *       myEmailsTodayEnabled: true,
       *       showContactInfo: false
       *     };
       *     return Promise.resolve(config);
       *   }});
       * ```
       * @returns {Promise} Promise represents {@link AdtConfig}
       */
      GetAdtConfig: 'getAdtConfig',

      _BeforeCallFinished: '_beforeCallFinished'
    },

    _init: function _init(apiFactory) {
      var _this = this;

      this._api = 'crmApi';

      apiFactory.addMethodProvider(this);

      // Define methods
      _.each(this.Methods, function (method) {
        apiFactory.defineSimpleMethodImplementation(_this, method);
      });

      // Define Event triggers
      _.each(this.EventTriggers, function (name) {
        _this[name] = apiFactory.defineEventTrigger(name);
      });

      this._destructors.push(this.bind(this.off));
    }
  });

  Api.mixin(Events);
  Api.mixin(MethodProvider);

  return Api;
});
//# sourceMappingURL=crm.api.js.map
;
define('sdk.public/crm/crm.api/crm.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/crm.api/crm.api', 'sdk.public/generic.public.api'], function (_, ApiFactory, IFrameIO, Api, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var apis = {};

  function createApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(apis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('crm_api_plugin_' + name), apiFactoryOptions);
      var api = new Api(factory);
      apis[name] = new PublicApi(api);
    }

    return apis[name];
  }

  return createApi;
});
//# sourceMappingURL=crm.api.factory.js.map
;
define('sdk.public/crm/hook.api/hook.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, Object, Events, MethodProvider) {
  /**
   * @class HookApi
   * @description Hooks allow you to customize some standard Five9 Adapter operations, like Search, Save Log,
   * Screen Pop, Set Disposition etc. Also you can cancel the action.
   *
   * Hook implementation should return resolved Promise. Promise must contain object with 'status' ({@link HookApiStatus})
   * attribute. Hook can return no value, it'll be treated as Proceed status.
   *
   * When hook returns Confirmation status, the Yes/No confirmation dialog will be shown. Yes is treated as
   * ProceedWithParams status (if you don't want to change any params, pass the original hook argument as params).
   * No is treated as Cancel status.
   *
   * Screen pop object type is CRM-dependent. Find your CRM object description in the documentation.
   */

  /**
   * @typedef {object} HookApiStatus
   * @property {HookApiStatusCode} statusCode Error code
   * @property {string} [message] Error or confirmation message
   * @property {string} [messageHeader] Confirmation message header
   */

  var Api = Object.extend({
    /**
     * @function registerApi
     * @memberof HookApi
     * @instance
     * @description Registers implementation of callbacks integrating ADT with CRM system. See example in {@tutorial basicintegration}
     * @param {HookApiCallbacks} param object with properties corresponding to callbacks you would like to implement
     * @returns {void}
     */

    /**
     * @interface HookApiCallbacks
     */

    Methods: {
      /**
       * @function beforeClickToDial
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to change click 2 dial data or cancel the action.
       * ```
       * hookApi.registerApi({
       *   beforeClickToDial: function(params) {
       *     if (params.click2DialData.crmObject && params.click2DialData.crmObject.type === 'Account') {
       *       return Promise.resolve({
       *         status: {
       *           statusCode: Five9.CrmSdk.HookStatusCode.Error,
       *           message: 'You cannot call to Account phone numbers.'
       *         }
       *       });
       *     }
       *     if (campaign) {
       *       params.click2DialData.preselectedCampaignName = campaign;
       *     }
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.ProceedWithParams },
       *       params: params
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {Click2DialData} params.click2DialData Data associated with click 2 dial operation
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       *  - params - Click 2 dial data in the same format as in the function argument.
       */
      BeforeClickToDial: 'beforeClickToDial',

      /**
       * @function beforeSuggestedNumbers
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to change suggested numbers data or cancel the action.
       * ```
       * hookApi.registerApi({
       *   beforeSuggestedNumbers: function(params) {
       *     // Do not suggest Case phone numbers
       *     const filtered = params.suggestedNumbers.filter((item) => {
       *       return item.crmObject === undefined || item.crmObject && item.crmObject.type !== 'Case';
       *     });
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.ProceedWithParams },
       *       params: { suggestedNumbers: filtered }
       *     });
       *   }
       * });
       * ```
       * @param {object} params Objects and configuration that will be used to populate suggested numbers menu
       * @param {Click2DialData[]} params.suggestedNumbers list of objects
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       *  - params - Suggested numbers data in the same format as in the function argument.
       */
      BeforeSuggestedNumbers: 'beforeSuggestedNumbers',

      /**
       * @function beforeDisposition
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to cancel setting disposition. This method is called before any
       * internal checks. The internal checks will be done only if this method doesn't cancel setting disposition.
       * ```
       * hookApi.registerApi({
       *   beforeDisposition: function(params) {
       *     return Promise.resolve({
       *       status: {
       *         statusCode: Five9.CrmSdk.HookStatusCode.Confirmation,
       *         message: `Do you want to finish this ${params.interactionType.toLowerCase()}?`,
       *         messageHeader: 'Confirmation'
       *       }
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {number} params.dispositionId Disposition id selected by agent
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       */
      BeforeDisposition: 'beforeDisposition',

      /**
       * @function beforeMakeCall
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to cancel making a call. This method is called before any
       * internal checks. The internal checks will be done only if this method doesn't cancel a call.
       * ```
       * hookApi.registerApi({
       *   beforeMakeCall: function(params) {
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.Cancel }
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {Destination} params.destination Agent/Skill/Speed Dial id or external number (depends on destination type)
       * @param {CallDialogType} params.callDialog Five9 Adapter UI component where call was initiated
       * @param {string} [params.campaignId] Selected campaign Id
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       */
      BeforeMakeCall: 'beforeMakeCall',

      /**
       * @function beforeTransfer
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to cancel interaction transfer. This method is called before any
       * internal checks. The internal checks will be done only if this method doesn't cancel transfer.
       * ```
       * hookApi.registerApi({
       *   beforeTransfer: function(params) {
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.Cancel }
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @param {CallTransferData | TransferData} params.transferData Transfer data
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       */
      BeforeTransfer: 'beforeTransfer',

      /**
       * @function beforeRecord
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to cancel call recording. This method is called before any
       * internal checks. The internal checks will be done only if this method doesn't cancel call recording.
       * ```
       * hookApi.registerApi({
       *   beforeRecord: function(params) {
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.Cancel }
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData} params.interactionData Interaction data
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       */
      BeforeRecord: 'beforeRecord',

      /**
       * @function beforeObjectVisited
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to change visited object data or cancel the action. Adapter
       * matches objects by id.
       * ```
       * hookApi.registerApi({
       *   beforeObjectVisited: function(params) {
       *     // Do not add Leads
       *     const filtered = params.visitedObjects.filter(item => item.type !== 'Lead');
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.ProceedWithParams },
       *       params: { visitedObjects: filtered }
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {CrmObject[]} params.visitedObjects Visited objects
       * @param {CrmObject[]} [params.objectsToRemove] Objects to be removed from visited objects list. There
       * are specific scenarios in some CRMs, for example, in Salesforce Lead can be converted to another
       * objects (Contact, Account etc.). In this case Lead is removed, Contact/Account are added.
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       *  - params - Visited objects data in the same format as in the function argument.
       */
      BeforeObjectVisited: 'beforeObjectVisited',

      /**
       * @function beforeSearch
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to replace search for CRM objects or cancel the action. If you don't want
       * to change anything return HookApiStatusCode.Proceed.
       *
       * If you want to replace adapter's search with your custom search: return HookApiStatusCode.Cancel and
       * search results. Adapter will keep the order of returned search results. In this case
       * {@link HookApiCallbacks#afterSearch|afterSearch} hook won't be called. If search results are not provided
       * the action will be cancelled.
       * ```
       * hookApi.registerApi({
       *   beforeSearch: function(params) {
       *     // Cancel Five9 adapter's CRM search and return custom search results.
       *     const crmObjects = [
       *       { id: "123", type: "Contact", label: "Contact", name: "Homer Simpson", isWho: true, isWhat: false,
       *         fields: [{ displayName: "Company", value: "Springfield Nuclear Power Plant" }] },
       *       { id: "456", type: "Contact", label: "Contact", name: "Marge Simpson", isWho: true, isWhat: false, fields: [] }
       *     ];
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.Cancel },
       *       searchResults: crmObjects
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction information
       * @param {CallSearchData | ChatSearchData} params.interactionSearchData Additional data. Used only when interaction type is 'Call' or 'Chat'
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       *  - searchResults: Array of {@link CrmObject} Search results
       */
      BeforeSearch: 'beforeSearch',

      /**
       * @function afterSearch
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to filter/modify/sort search results. Adapter will keep the order
       * of returned search results.
       * ```
       * hookApi.registerApi({
       *   afterSearch: function(params) {
       *     // Do not add Leads to search results
       *     const filtered = params.searchResults.filter(item => item.type !== "Lead");
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.ProceedWithParams },
       *       searchResults: filtered
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {SearchResult} params.searchResults CRM search results
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       *  - searchResults: Array of {@link CrmObject} Transformed search results
       */
      AfterSearch: 'afterSearch',

      /**
       * @function beforeScreenPop
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to replace screen pop to the CRM object or cancel the action. If you
       * don't want to change anything return HookApiStatusCode.Proceed.
       *
       * If you want to replace adapter's screen pop with your custom screen pop: return HookApiStatusCode.Cancel.
       * In this case {@link HookApiCallbacks#afterScreenPop|afterScreenPop} hook won't be called.
       * @param {object} params
       * @param {object[]} params.screenPopObjects Objects for screen pop.
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @param {ScreenPopType} params.screenPopType Screen pop type
       * @param {boolean} [params.force] Do force screen pop (if supported by CRM)
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       */
      BeforeScreenPop: 'beforeScreenPop',

      /**
       * @function afterScreenPop
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to do additional actions after screen pop.
       * @param {object} params
       * @param {object[]} params.screenPopObjects Objects for screen pop.
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @param {ScreenPopType} params.screenPopType Screen pop type
       * @param {boolean} [params.force] Do force screen pop (if supported by CRM)
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       */
      AfterScreenPop: 'afterScreenPop',

      /**
       * @function beforeSaveLog
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to add fields to interaction (Call, Email, Chat) log. If you don't want
       * to change anything return HookApiStatusCode.Proceed.
       *
       * If you want to add/modify interaction log fields: return HookApiStatusCode.ProceedWithParams and
       * 'newFields' object.
       *
       * If you return HookApiStatusCode.Cancel the interaction log won't be saved and
       * {@link HookApiCallbacks#afterSaveLog|afterSaveLog} hook won't be called.
       * ```
       * hookApi.registerApi({
       *   beforeSaveLog: function(params) {
       *     const newFields = {};
       *     // Update field
       *     newFields.subject = params.interactionLogData.subject + ' Update: important note.';
       *     // Add new field to interaction log
       *     newFields.transferredAgent = 'Jolly Roger';
       *     return Promise.resolve({
       *       status: { statusCode: Five9.CrmSdk.HookStatusCode.ProceedWithParams },
       *       newFields
       *     });
       *   }
       * });
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @param {CallLogData | ChatLogData | EmailLogData} params.interactionLogData Interaction log data
       * @param {string} [params.interactionLogId] Interaction log id (if it was already created at interaction start)
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       *  - newFields: {object} (optional) - New interaction log fields in key-value format.
       */
      BeforeSaveLog: 'beforeSaveLog',

      /**
       * @function afterSaveLog
       * @abstract
       * @memberof HookApiCallbacks
       * @instance
       * @description Implement this callback to do additional actions after saving interaction log.
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @param {CallLogData | ChatLogData | EmailLogData} params.interactionLogData Interaction log data
       * @param {string} [params.interactionLogId] Saved interaction log id (if available)
       * @returns {Promise} Promise represents object
       *  - status: {@link HookApiStatus}
       */
      AfterSaveLog: 'afterSaveLog'
    },

    _init: function _init(apiFactory) {
      var _this = this;

      this._api = 'hookApi';

      apiFactory.addMethodProvider(this);

      // Define methods
      _.each(this.Methods, function (method) {
        apiFactory.defineSimpleMethodImplementation(_this, method);
      });

      this._destructors.push(this.bind(this.off));
    }
  });

  Api.mixin(Events);
  Api.mixin(MethodProvider);

  return Api;
});
//# sourceMappingURL=hook.api.js.map
;
define('sdk.public/crm/hook.api/hook.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/hook.api/hook.api', 'sdk.public/generic.public.api'], function (_, ApiFactory, IFrameIO, Api, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var apis = {};

  function createApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(apis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('hook_api_plugin_' + name), apiFactoryOptions);
      var api = new Api(factory);
      apis[name] = new PublicApi(api);
    }

    return apis[name];
  }

  return createApi;
});
//# sourceMappingURL=hook.api.factory.js.map
;
define('msgbus/duplex-iframe-io-master',['underscore', 'msgbus/duplex-iframe-io', 'msgbus/utils'], function (_, DuplexIo, Utils) {
  var DuplexIframeIO = DuplexIo.extend({
    connect: function connect() {
      this._logDebug('Start broadcast connect');

      Utils.forEachIframe(this.bind(this._sendConnect));
    },
    _init: function _init(channelName) {
      this._super._init.call(this, channelName);
      this._name = 'master_' + this._name;

      window.addEventListener('message', this.bind(this._onWindowMessage), false);
    },
    _onWindowMessage: function _onWindowMessage(event) {
      var data = event.data;

      if (_.isObject(data) && this._fromExpectedSource(data)) {
        if (data.message === DuplexIo.MESSAGE_ASKING_CONNECT) {
          this._logDebug('Got incoming connect request: ', data.message);
          this._sendConnect(event.source);
        }
      }
    },
    _sendConnect: function _sendConnect(targetWindow) {
      // Do not send connect if a frame already has one
      var existingPortId = null;
      _.each(this._frames, function (frame, portId) {
        if (frame === targetWindow) {
          existingPortId = portId;
        }
      });
      if (existingPortId) {
        this._logDebug('Frame already has a port: ' + existingPortId);
        return;
      }

      var channel = new window.MessageChannel();
      channel.port1.onmessage = this.bind(function (event) {
        this._deletePort(event.data.sender);

        // Save message channel so it is not cleared by garbage collector
        this._channels[event.data.sender] = channel;
        this._ports[event.data.sender] = channel.port1;
        this._frames[event.data.sender] = targetWindow;

        channel.port1.onmessage = this.bind(this._onPortMessage);
        channel.port1.onmessageerror = this.bind(this._onPortMessageError);

        this._onPortMessage(event);
      });

      try {
        var data = this._pack(DuplexIo.MESSAGE_CONNECT);
        targetWindow.postMessage(data, '*', [channel.port2]);
      } catch (err) {
        this._logDebug('Could not send connect message to', targetWindow, err);
      }
    }
  });

  return DuplexIframeIO;
});
//# sourceMappingURL=duplex-iframe-io-master.js.map
;
define('sdk.public/crm/custom.methods.api/custom.methods.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, Object, Events, MethodProvider) {
  var Api = Object.extend({
    Methods: {
      CallCustomMethod: '_callCustomMethod'
    },

    Apis: {
      CallCustomMethod: '_callCustomMethod'
    },

    _init: function _init(apiFactory) {
      this._api = 'customMethodsApi';

      apiFactory.addMethodProvider(this);

      apiFactory.defineSimpleMethodImplementation(this, this.Methods.CallCustomMethod);

      // Define Apis
      this._callCustomMethod = apiFactory.defineSimpleMethod(this.Apis.CallCustomMethod);

      this._destructors.push(this.bind(this.off));
    }
  });

  Api.mixin(Events);
  Api.mixin(MethodProvider);

  return Api;
});
//# sourceMappingURL=custom.methods.api.js.map
;
define('sdk.public/crm/custom.methods.api/custom.methods.public.api',['underscore'], function (_) {
  /**
   * @class CustomMethodsApi
   */
  var CustomMethodsPublicApi = function CustomMethodsPublicApi(privateApi) {
    var registeredMethods = {};

    /**
     * @function callCustomMethod
     * @memberof CustomMethodsApi
     * @instance
     * @description Calls a custom method registered in another frame on a page. It returns Promise object
     * so you can wait for a result.
     * If the custom method is registered by several frames on a page then it will be called in all of them.
     * You can still listen to a result but the only one result (a random one) will be delivered to the caller.
     * ```
     * customMethodsApi.callCustomMethod('setValue', 'This is a value!').then(
     *   () => console.error('setValue() finished successfully!'),
     *   error => console.error('setValue() failed!', error)
     * );
     *
     * customMethodsApi.callCustomMethod('getValue').then(
     *   value => console.log('getValue() finished successfully!', value);
     *   error => console.error('getValue() failed!', error)
     * )
     * ```
     * @param {string} methodName Name of a custom method
     * @param {object} argument Argument for a custom method. It is an object that can be used as a message for window.postMessage() API call
     * (see your browser documentation for any possible limitations)
     * @returns {Promise} Result of a custom method
     */
    this.callCustomMethod = function (methodName, argument) {
      return privateApi._callCustomMethod({ methodName: methodName, argument: argument });
    };

    /**
     * @function registerCustomMethods
     * @memberof CustomMethodsApi
     * @instance
     * @description Registers custom methods so they can be called from other frames on a page.
     * It takes an object with a number of functions. Each function represents a custom method implementation.
     * A function name should match a methodName you use for {@link callCustomMethod} API.
     * A function can return either a value or a thenable object. When a value is returned it will lead to resolving a promise on a caller end.
     * When a thenable object is returned we wait until it's resolved/rejected and then propagate the result to a caller.
     * ```
     * customMethodsApi.registerCustomMethods({
     *   setValue (newValue) {
     *     return new Promise(function(resolve) {
     *       // set value then resolve the promise
     *       resolve();
     *     });
     *     // or we can simple set a new value
     *     // value = newValue;
     *   }
     *
     *   getValue () {
     *     return new Promise(function(resolve) {
     *      let value;
     *      // get value then resolve the promise
     *      resolve(value);
     *     });
     *     // or we can simple return the value
     *     // return value;
     *   }
     * });
     * ```
     * @param {object} methods Custom methods
     * @returns {void}
     */
    this.registerCustomMethods = function (methods) {
      registeredMethods = methods || {};
    };

    privateApi.setMethod(privateApi.Methods.CallCustomMethod, function (_ref) {
      var methodName = _ref.methodName,
          argument = _ref.argument;

      var method = registeredMethods[methodName];
      if (_.isFunction(method)) {
        return method.call(registeredMethods, argument);
      }
    });
  };

  return CustomMethodsPublicApi;
});
//# sourceMappingURL=custom.methods.public.api.js.map
;
define('sdk.public/crm/custom.methods.api/custom.methods.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'msgbus/duplex-iframe-io-master', 'sdk.public/crm/custom.methods.api/custom.methods.api', 'sdk.public/crm/custom.methods.api/custom.methods.public.api'], function (_, ApiFactory, IFrameIORemote, IFrameIOMaster, Api, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    }
  };

  var apis = {};

  function isAdapterPage() {
    return window.Five9 && window.Five9.root === '/';
  }

  function createApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(apis[name]).isObject()) {
      var channelName = 'custom_methods_api_' + name;
      var io = isAdapterPage() ? new IFrameIOMaster(channelName) : new IFrameIORemote(channelName);

      var factory = new ApiFactory(io, apiFactoryOptions);

      var api = new Api(factory);
      apis[name] = new PublicApi(api);
    }

    return apis[name];
  }

  return createApi;
});
//# sourceMappingURL=custom.methods.api.factory.js.map
;
define('sdk.public/crm/sf.native.api/sf.native.api',['underscore', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Object, Events, MethodProvider) {
  /**
   * @class SfNativeApi
   * @description contains native Salesforce methods available in Salesforce OpenCTI API.
   */

  var Api = Object.extend({
    Apis: {
      /**
       * @function screenPop
       * @memberof SfNativeApi
       * @instance
       * @description Screenpops Salesforce page
       *
       * Please see Salesforce documentation for description of method parameters. The method returns promise with the result of execution
       * so callback parameter is not used.
       *
       * For Lighting mode: {@link https://developer.salesforce.com/docs/atlas.en-us.api_cti.meta/api_cti/sforce_api_cti_screenpop_lex.htm}
       * ```
       * sfNativeApi.screenPop({type: 'sobject', params: {recordId: '500A0000000flRF'});
       * ```
       * For Classic mode: {@link https://developer.salesforce.com/docs/atlas.en-us.api_cti.meta/api_cti/sforce_api_cti_screenpop.htm}
       * Parameters are grouped in object
       *  ```
       * sfNativeApi.screenPop({url: '500A0000000flRF', force: true});
       * ```
       *
       * @returns {Promise} Promise represents result of the operation.
       */

      ScreenPop: 'screenPop',

      /**
       * @function runApex
       * @memberof SfNativeApi
       * @instance
       * @description Executes an Apex method from an Apex class thatÃ¢â‚¬â„¢s exposed in Salesforce.
       * ```
       * sfNativeApi.runApex({apexClass: "CaseHelper", methodName: "acceptCase", caseId=500A0000000flRF});
       * ```
       * @param {object} params Parameters
       * @param {string} params.apexClass Specifies the Apex class of the method to execute.
       * @param {string} params.methodName  Specifies the method to execute
       * @param {string} params.methodParams  Specifies the method parameters to pass. The string must include field value pairs and be formatted as a valid query string.
        * @returns {Promise} Promise represents result of the operation.
       */
      RunApex: 'runApex'
    },

    _init: function _init(apiFactory) {
      var _this = this;

      this._api = 'sfNativeApi';

      apiFactory.addMethodProvider(this);

      // Define Apis
      _.each(this.Apis, function (method) {
        _this[method] = apiFactory.defineSimpleMethod(method);
      });

      this._destructors.push(this.bind(this.off));
    }
  });

  Api.mixin(Events);
  Api.mixin(MethodProvider);

  return Api;
});
//# sourceMappingURL=sf.native.api.js.map
;
define('sdk.public/crm/sf.native.api/sf.native.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/sf.native.api/sf.native.api', 'sdk.public/generic.public.api'], function (_, ApiFactory, IFrameIO, Api, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var apis = {};

  function createApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(apis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('sf_native_api_plugin_' + name), apiFactoryOptions);
      var api = new Api(factory);
      apis[name] = new PublicApi(api);
    }

    return apis[name];
  }

  return createApi;
});
//# sourceMappingURL=sf.native.api.factory.js.map
;
define('sdk.public/crm/application.api/application.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, MsgBusObject, Events, MethodProvider) {
  /**
   * @class ApplicationApi
   * @description Application API contains methods and event to track application lifecycle and user activity, get/set
   * application data and do UI actions (like show/hide error messages).
   */

  /**
   * @typedef {object} ApplicationApiErrorStatus
   * @property {ApiErrorCode} errorCode Error code
   * @property {string} [errorMessage] Error message
   */

  var ApplicationApi = MsgBusObject.extend({
    Events: {
      SESSION_INITIALIZED: 'sessionInitialized',
      LOGIN_STATE_CHANGED: 'loginStateChanged'
    },

    /**
     * @interface ApplicationApiEvents
     */

    /**
     * @function sessionInitialized
     * @abstract
     * @memberof ApplicationApiEvents
     * @instance
     * @description Implement this callback to execute your code when web socket initialization complete.
     * @returns {void}
     */

    /**
     * @function loginStateChanged
     * @abstract
     * @memberof ApplicationApiEvents
     * @instance
     * @description Implement this callback to execute your code when login state is changed. Agent login consists of
     * some steps following in particular order. You can use this event to detect the state. For example, you can get
     * application configuration in 'WORKING' state only.
     * @param {object} params
     * @param {LoginState} params.state Login state
     * @returns {void}
     */

    /**
     * @function subscribe
     * @memberof ApplicationApi
     * @instance
     * @description Subscribes to Application Api events.
     *```
     * const applicationApi = window.Five9.CrmSdk.applicationApi();
     * applicationApi.subscribe({
     *     sessionInitialized: () => {},
     *     loginStateChanged: (params) => {}
     * });
     *```
     * @param {ApplicationApiEvents} apiEvents Callbacks corresponding to the events will be called on object passed as parameter
     * @returns {void}
     */

    Apis: {
      /**
       * @function getConfig
       * @memberof ApplicationApi
       * @instance
       * @description Retrieves application configuration. Application configuration must be requested in 'WORKING' state only.
       * ```
       * applicationApi.subscribe({
       *     loginStateChanged: (params) => {
       *       if (params.state === 'WORKING') {
       *         applicationApi.getConfig().then(config => {
       *           console.debug('Application API got config: ' + JSON.stringify(config));
       *         });
       *       }
       *     }
       * });
       * ```
       * @returns {Promise} Promise object represents {@link AppConfig}[]
       * In case of error Promise is rejected and {@link ApplicationApiErrorStatus} is returned.
       */
      GetConfig: 'getConfig',

      /**
       * @function showErrorMessage
       * @memberof ApplicationApi
       * @instance
       * @description Show error message in adapter
       *```
       * applicationApi.showErrorMessage({ msgText: 'Operation cannot be completed.' });
       *```
       * You must pass the same message text to hide error message.
       * @param {object} params
       * @param {string} params.msgText Message text
       * @returns {Promise} Promise is resolved if operation succeeded.
       * In case of error Promise is rejected and {@link ApplicationApiErrorStatus} is returned.
       */
      ShowErrorMessage: 'showErrorMessage',

      /**
       * @function hideErrorMessage
       * @memberof ApplicationApi
       * @instance
       * @description Hide error message in adapter
       *```
       * applicationApi.hideErrorMessage({ msgText: 'Operation cannot be completed.' });
       *```
       * @param {object} params
       * @param {string} params.msgText Message text
       * @returns {Promise} Promise is resolved if operation succeeded.
       * In case of error Promise is rejected and {@link ApplicationApiErrorStatus} is returned.
       */
      HideErrorMessage: 'hideErrorMessage'
    },

    _init: function _init(apiFactory) {
      var _this = this;

      this._api = 'applicationApi';
      this._apiFactory = apiFactory;

      // Define Events
      _.each(this.Events, function (name) {
        apiFactory.defineEvent(_this, name);
      });

      // Define Apis
      _.each(this.Apis, function (method) {
        _this[method] = apiFactory.defineSimpleMethod(method);
      });

      this._destructors.push(this.bind(this.off));
    }
  });

  ApplicationApi.mixin(Events);
  ApplicationApi.mixin(MethodProvider);

  return ApplicationApi;
});
//# sourceMappingURL=application.api.js.map
;
define('sdk.public/crm/application.api/application.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/application.api/application.api', 'sdk.public/generic.public.api'], function (_, ApiFactory, IFrameIO, Api, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var apis = {};

  function createApplicationApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(apis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('app_api_plugin_' + name), apiFactoryOptions);
      var api = new Api(factory);
      apis[name] = new PublicApi(api);
    }

    return apis[name];
  }

  return createApplicationApi;
});
//# sourceMappingURL=application.api.factory.js.map
;
define('sdk.public/types/api.error.code',[], function () {
  /**
   * CRM SDK error code.
   * @typedef {object} ApiErrorCode
   * @property {string} Generic Generic error
   * @property {string} InteractionNotFound Five9 Adapter cannot find interaction. Interaction type or id is invalid.
   * Also it is possible that interaction is already finished
   * @property {string} NoData Interaction exists, but requested data cannot be acquired. It might be a result of
   * some error/bug in Five9 Adapter
   */
  return {
    Generic: 'Generic',
    InteractionNotFound: 'InteractionNotFound',
    NoData: 'NoData'
  };
});
//# sourceMappingURL=api.error.code.js.map
;
define('sdk.public/crm/hook.api/hook.api.status.code',[], function () {
  /**
   * Hook API status code. If status code is not Proceed/ProceedWithParams Five9 Adapter will not execute the action.
   * @typedef {object} HookApiStatusCode
   * @property {string} Proceed Five9 Adapter will execute the action as usual
   * @property {string} ProceedWithParams Five9 Adapter will execute the action with updated parameters
   * @property {string} Cancel Five9 Adapter will not execute the action. It is assumed the action is done in the hook implementation and result is returned (if applicable).
   * @property {string} Confirmation Five9 Adapter will show Yes/No dialog to agent. If agent presses Yes ProceedWithParams status is applied, otherwise Cancel status is applied.
   * @property {string} Error Five9 Adapter will not execute the action. Error message will be shown (if provided).
   */
  return {
    Proceed: 'Proceed',
    ProceedWithParams: 'ProceedWithParams',
    Cancel: 'Cancel',
    Confirmation: 'Confirmation',
    Error: 'Error'
  };
});
//# sourceMappingURL=hook.api.status.code.js.map
;
/**
 * @namespace Five9
 */
define('five9.crm.sdk',['sdk.public/crm/interaction.api/interaction.api.factory', 'sdk.public/crm/custom.components.api/components.api.factory', 'sdk.public/crm/crm.api/crm.api.factory', 'sdk.public/crm/hook.api/hook.api.factory', 'sdk.public/crm/custom.methods.api/custom.methods.api.factory', 'sdk.public/crm/sf.native.api/sf.native.api.factory', 'sdk.public/crm/application.api/application.api.factory', 'sdk.public/types/api.error.code', 'sdk.public/crm/hook.api/hook.api.status.code'], function (interactionApi, customComponentsApi, crmApi, hookApi, customMethodsApi, sfNativeApi, applicationApi, ApiErrorCode, HookStatusCode) {
  /**
   * @namespace CrmSdk
   * @memberof Five9
   */
  return {
    /**
     * @function interactionApi
     * @memberof Five9.CrmSdk
     * @instance
     * @description Use this method to obtain reference to Interaction API instance. If Five9 Plugin SDK is loaded
     *```
     * const interactionApi = window.Five9.CrmSdk.interactionApi();
     *```
     * in multiple iframes on the same page all instances will receive events and can be used to execute methods.
     * @returns {InteractionApi} reference to Interaction API instance
     */
    interactionApi: interactionApi,

    /**
     * @function customComponentsApi
     * @memberof Five9.CrmSdk
     * @instance
     * @description Use this method to obtain reference to Custom Components API instance. Only one instance of Custom Components API can be used on the same page.
     * If Five9 Plugin SDK is loaded in multiple iframes on the same page the first instance of Custom Components API that establishes connection to Five9
     * Agent Desktop Toolkit will receive events
     *```
     * const customComponentsApi = window.Five9.CrmSdk.customComponentsApi();
     *```
     * @returns {CustomComponentsApi} reference to Custom Components API instance
     */
    customComponentsApi: customComponentsApi,

    /**
     * @function crmApi
     * @memberof Five9.CrmSdk
     * @instance
     * @description Use this method to obtain reference to CRM API instance. Only one instance of CRM API can be used on the same page.
     * If Five9 Plugin SDK is loaded in multiple iframes on the same page the first instance of CRM API that establishes connection to Five9
     * Agent Desktop Toolkit will receive events
     *```
     * const crmApi = window.Five9.CrmSdk.crmApi();
     *```
     * @returns {CrmApi} reference to CRM API instance
     */
    crmApi: crmApi,

    /**
     * @function hookApi
     * @memberof Five9.CrmSdk
     * @instance
     * @description Use this method to obtain reference to Hook API instance. Only one instance of Hook API can be used on the same page.
     * If Five9 Plugin SDK is loaded in multiple iframes on the same page the first instance of Hook API that establishes connection to Five9
     * Agent Desktop Toolkit will receive events
     *```
     * const hookApi = window.Five9.CrmSdk.hookApi();
     *```
     * @returns {HookApi} reference to Hook API instance
     */
    hookApi: hookApi,

    /**
     * @function customMethodsApi
     * @memberof Five9.CrmSdk
     * @instance
     * @description Use this method to obtain a Custom Methods API instance. You can use this API to establish a communication channel between
     * a customization bundle and an iframe on a page. So you can call methods implemented in an iframe from a customization bundle and vice versa.
     *```
     * const customMethodsApi = window.Five9.CrmSdk.customMethodsApi();
     *```
     * @returns {CustomMethodsApi} reference to Custom Methods API instance
     */
    customMethodsApi: customMethodsApi,

    /**
     * @function sfNativeApi
     * @memberof Five9.CrmSdk
     * @instance
     * @description Use this method to obtain a Salesforce Native API instance. You can use this API to establish a communication channel between
     * a customization bundle and an iframe on a page. So you can call methods implemented in an iframe from a customization bundle and vice versa.
     *```
     * const sfNativeApi = window.Five9.CrmSdk.sfNativeApi();
     *```
     * @returns {SfNativeApi} reference to Salesforce Native API instance
     */
    sfNativeApi: sfNativeApi,

    /**
     * @function applicationApi
     * @memberof Five9.CrmSdk
     * @instance
     * @description Use this method to obtain reference to Application API instance. If Five9 Plugin SDK is loaded
     *```
     * const applicationApi = window.Five9.CrmSdk.applicationApi();
     *```
     * @returns {ApplicationApi} reference to Application API instance
     */
    applicationApi: applicationApi,

    /**
     * @property {ApiErrorCode} ApiErrorCode API error codes
     * @memberof Five9.CrmSdk
     */
    ApiErrorCode: ApiErrorCode,

    /**
     * @property {HookApiStatusCode} HookStatusCode Hook API status codes
     * @memberof Five9.CrmSdk
     */
    HookStatusCode: HookStatusCode
  };
});
//# sourceMappingURL=five9.crm.sdk.js.map
;
  return require('five9.crm.sdk');
}));
define('modules/contactEmailVerification',["ui.api.v1", "modules/commonFunctions", "crmsdk", "underscore", "jquery"], function (UiApi, CommonFunctions, CrmSdk, _, $) {
  let contactEmailVerification = {};

  contactEmailVerification.VERSION = '1.1.2';
  contactEmailVerification.cavList = "";
  contactEmailVerification.interactionId = "";
  contactEmailVerification.contactEmail = "";
  contactEmailVerification.contactId = "";
  contactEmailVerification.isConferenceCall = false;

  /**
   * Called when the customization is first loaded
   */
  contactEmailVerification.initialize = function () {
    const interactionApi = CrmSdk.interactionApi();
    localStorage.removeItem('emailVerificationButtonPressed');
    contactEmailVerification.emailVerificationButtonPressed = false;

    interactionApi.subscribe({
      callStarted: (params) => {
        contactEmailVerification.interactionId = params.callData.interactionId;
        contactEmailVerification.isConferenceCall = false;
        interactionApi
          .executeRestApi({
            path: "/appsvcs/rs/svc/agents/" + params.callData.agentId + "/interactions/calls/" + params.callData.interactionId + "/contacts",
            method: "GET",
            payload: null,
          })
          .then(function (result) {
            const contactData = JSON.parse(result.response);
            let contactEmailField = CommonFunctions.getContactFieldByName("email");
            contactEmailVerification.contactEmail = contactData.contacts[0].fields[contactEmailField.id];
            contactEmailVerification.contactId = contactData.contacts[0].id;
            UiApi.Logger.info("contactEmailVerification", "interactionApi.callStarted", "contactData", contactData);
          });

        interactionApi.getCav({ interactionId: params.callData.interactionId }).then((cavList) => {
          UiApi.Logger.debug("contactEmailVerification", "interactionApi.callStarted", "Interaction API got cavList: " + JSON.stringify(cavList));
          contactEmailVerification.cavList = cavList;
        });
      },
      callFinished: (params) => {
        localStorage.removeItem('emailVerificationButtonPressed');
        contactEmailVerification.emailVerificationButtonPressed = false;
        contactEmailVerification.contactEmail = "";
        contactEmailVerification.contactId = "";
        contactEmailVerification.interactionId = "";

        UiApi.Logger.info("contactEmailVerification", "interactionApi.callFinished", "call finished: " + params);
      },
    });

    const hookApi = CrmSdk.hookApi();
    hookApi.registerApi({
      beforeDisposition: async (params) => {
        const proceed = Promise.resolve({
          status: {
            statusCode: CrmSdk.HookStatusCode.Proceed,
          },
        });

        disposition = CommonFunctions.getDispositionsByCampaignId(params.interactionData.campaignId, params.dispositionId);
        if (params.interactionData.interactionSubType !== 'Call' || contactEmailVerification.isConferenceCall || disposition.name === 'Transferred To 3rd Party') {
          return proceed;
        }

        // The email-verified state is stored on the interaction's CAV so it is
        // shared across browser contexts (embedded adapter vs. popped-out window).
        // In-memory flags and localStorage are not reliably shared when the
        // adapter is popped out, so we read the CAV as the source of truth.
        if (await contactEmailVerification.isEmailVerified(params.interactionData.interactionId)) {
          return proceed;
        }

        return Promise.resolve({
          status: {
            statusCode: CrmSdk.HookStatusCode.Error,
            message: `Please verify the email for this ${params.interactionType.toLowerCase()}?`,
            messageHeader: "Error",
          },
        });
      },
    });
  };

  /**
   * Returns true if the Custom.emailVerified CAV has been set (to either true or
   * false) on the given interaction. Reads the CAVs fresh from the interaction so
   * the result is correct regardless of which browser context the disposition
   * hook runs in (embedded adapter or popped-out window).
   */
  contactEmailVerification.isEmailVerified = async function (interactionId) {
    try {
      const interactionApi = CrmSdk.interactionApi();
      const cavList = await interactionApi.getCav({ interactionId: interactionId });
      if (!cavList) {
        return false;
      }
      const verifiedCav = cavList.find((cav) => cav.group && cav.group.includes("Custom") && cav.name === "emailVerified");
      if (!verifiedCav) {
        return false;
      }
      const value = verifiedCav.value;
      return value === true || value === "true" || value === false || value === "false";
    } catch (e) {
      UiApi.Logger.info("contactEmailVerification", "isEmailVerified", "error reading CAV", e);
      return false;
    }
  };

  /**
   * Get cav
   */
  contactEmailVerification.getCav = function (group, cavname) {
    if (contactEmailVerification.cavList) {
      for (const cav of contactEmailVerification.cavList) {
        if (cav.group.includes(group) && cavname == cav.name) {
          return cav.id;
        }
      }
    }
  };
  /**
   * Set cav. Returns the underlying SDK promise so callers can await the write
   * before allowing the agent to proceed (e.g. to disposition).
   */
  contactEmailVerification.setCav = function (interactionid, cavlist) {
    const interactionApi = CrmSdk.interactionApi();
    return interactionApi.setCav({
      interactionId: interactionid,
      cavList: cavlist,
    });
  };

  /**
   * Update contact, to update a contact we have to first get the contact to retreive the latest timestamp and then pass that over in an update
   */
  contactEmailVerification.updateContact = function (interactionid, agentid, newcontactemail) {
    const interactionApi = CrmSdk.interactionApi();

    interactionApi
      .executeRestApi({
        path: `/appsvcs/rs/svc/agents/${agentid}/interactions/calls/${interactionid}/contacts`,
        method: "GET",
        payload: null,
      })
      .then((result) => {
        if (result.status !== 200) {
          return;
        }
        const response = JSON.parse(result.response);
        const contactData = response.contacts[0];
        const contactId = contactData.id;
        const modificationTime = contactData.modificationTime;

        const emailField = CommonFunctions.getContactFieldByName("email");
        var updatedContact = {};
        updatedContact.id = contactData.id;
        updatedContact.fields = { [emailField.id]: newcontactemail };
        updatedContact.modificationTime = contactData.modificationTime;

        interactionApi
          .executeRestApi({
            path: `/appsvcs/rs/svc/agents/${agentid}/interactions/calls/${interactionid}/update_contact`,
            method: "PUT",
            payload: JSON.stringify(updatedContact),
          })
          .then((result) => {
            if (result.status === 204) {
              UiApi.Logger.info("contactEmailVerification", "updateContact", "result", result);
            }
          });
      });
  };

  /**
   * Called when the model is loaded
   */
  contactEmailVerification.onModelLoad = function () {
    UiApi.Logger.info("contactEmailVerification", "onModelLoad", "contactEmailVerification", "onModelLoad");
  };

  /**
   * Called when the model is unloaded
   */
  contactEmailVerification.onModelUnload = function () {
    UiApi.Logger.info("contactEmailVerification", "onModelUnload", "contactEmailVerification", "onModelUnload");
  };

  /**
   * Call State handler.  This is where most of the apps activity takes place.
   * We wait until a call is being dispositioned, and then record it to connectwise
   */
  contactEmailVerification.onCallState = function () {
    UiApi.Logger.info("contactEmailVerification", "onCallState", "contactEmailVerification", "onCallState");
  };

  /**
   * Get the current call model
   */
  contactEmailVerification.getCallModel = function () {
    const activeTask = UiApi.ComputedModels.activeTasksModel().getActiveTask(UiApi.ActiveTaskType.Call);
    return UiApi.Root.Agent(UiApi.Context.AgentId).Call(activeTask.id);
  };

  /**
   * Get the current agent model
   */
  contactEmailVerification.getAgentModel = function () {
    return UiApi.Root.Agent(UiApi.Context.AgentId);
  };

  /**
   * Get the active task
   */
  contactEmailVerification.getActiveTask = function (type) {
    return UiApi.ComputedModels.activeTasksModel().getActiveTask(type);
  };

  // Return the contactEmailVerification object instance
  return contactEmailVerification;
});

define('workflow/init',["ui.api.v1", "modules/commonFunctions", "modules/contactEmailVerification"], function (UiApi, CommonFunctions, contactEmailVerification) {
  return {
    initialize: function () {
      //Place your library initialization code here
      UiApi.Logger.debug("init:workflow:initialize");
      CommonFunctions.initialize();
      contactEmailVerification.initialize();
    },

    onModelLoad: function () {
      //Place your server model subscription code here
      UiApi.Logger.debug("init:workflow:onModelLoad");
      CommonFunctions.onModelLoad();
      contactEmailVerification.onModelLoad();
    },

    onModelUnload: function () {
      //Place your cleanup code here
      UiApi.Logger.debug("init:workflow:onModelUnload");
      CommonFunctions.onModelUnload();
      contactEmailVerification.onModelUnload();
    },
  };
});

define('presentation.models/li-call-details.pres.model',[
  "ui.api.v1",
  "modules/commonFunctions",
  "modules/contactEmailVerification",
  "models/server/callConstants",
  "models/server/calls",
  "underscore",
], function (UiApi, CommonFunctions, ContactInfo, CallConstants, Calls, _) {
  return UiApi.PresentationModel.extend({
    initialize: function (params) {
      UiApi.Logger.debug("callDetailsPresModel", "initialize", '1.1.2');

      var agentModel = UiApi.Root.Agent(UiApi.Context.AgentId);
      var callModel = agentModel.Call(params.callId);
      var allCallsModel = UiApi.Root.Agent(UiApi.Context.AgentId).Calls();
      var callVariables = UiApi.Context.Tenant.CallVariables();
      var campaigns = UiApi.Context.Tenant.Campaigns();
      var agentPermissions = agentModel.Permissions();
      var agentSkills = agentModel.Skills();

      allCallsModel.on(
        "add",
        _.bind((model) => {
          if (this.isConferenceCall(model)) {
            model.on(
              "change:state",
              _.bind((confModel, newState) => {
                switch (newState) {
                  case CallConstants.State.ParticipantTalking:
                    ContactInfo.isConferenceCall = true;
                    break;
                  case CallConstants.State.Finished:
                    ContactInfo.isConferenceCall = false;
                    break;
                }
              }, this)
            );
          }
        }, this)
      );

      var viewAttributes = new UiApi.LocalModel({
        name: "CallTabModel",
        sessionId: params.callId,
        version: "0.01",
        attributes: {
          customerEmailValue: { default: undefined, persistence: UiApi.LocalModel.Persistence.Session },
        },
      });

      var options = {};

      options.sourceModel = new UiApi.ModelAggregator([
        { key: "call", model: callModel },
        { key: "callVariables", model: callVariables },
        { key: "campaigns", model: campaigns },
        { key: "viewAttributes", model: viewAttributes },
        { key: "agentPermissions", model: agentPermissions },
        { key: "agentSkills", model: agentSkills },
      ]);

      options.computedAttributes = {
        customerEmail: this.computeCustomerEmail,
      };

      this._init(options);
    },

    onPreCompute: function () {},

    computeCustomerEmail: function () {
      let contactEmailField = CommonFunctions.getContactFieldByName("email");
      let callModel = this.getCallModel();
      let contact = callModel.get("activeContact");
      return !contact || !contact.fields ? "" : contact.fields[contactEmailField.id];
    },

    isConferenceCall: function (call) {
      if (!call) return false;
      const callType = call.get("callType");
      const ani = call.get("ani");
      const addressType = call.get("addressType");
      const callState = call.get("state");
      const dnis = call.get("dnis");
      var isConfCall =
        !!call &&
        ani.startsWith("agent:") &&
        (callState === CallConstants.State.ParticipantRinging ||
          callState === CallConstants.State.ParticipantTalking ||
          callState === CallConstants.State.ParticipantConsulting);
      return isConfCall;
    },

    getCallModel: function () {
      return this.get("sourceModel").get("call");
    },
  });
});

define('components/3rdPartyComp-li-call-details-bottom/views/view',["ui.api.v1", "jquery", "modules/commonFunctions", "modules/contactEmailVerification"], function (UiApi, $, CommonFunctions, ContactInfo) {
  let contactEmail;
  let newContactEmail;
  let updateEmail = true;
  var Views = {};
  let loadContactInfoInterval;
  let loadEmailValidationMessage;

  Views.Layout = UiApi.Framework.Container.extend({
    template: "3rdPartyComp-li-call-details-bottom",

    events: {
      "click #verify-email": "onEmailVerify",
      "click #do-not-verify-email": "onEmailDoNotVerify",
      "keyup #customer-email": "onEmailChange",
    },

    initialize: function (options) {
      UiApi.Logger.debug("plus-adapter-customization", "3rdPartyComp-li-call-details-bottom", "initialize", '1.1.2');
      var activeTask = UiApi.ComputedModels.activeTasksModel().getActiveTask(UiApi.ActiveTaskType.Call);
      if (!!activeTask) {
        this.model = UiApi.SharedPresModelRepo.getModel("li-call-details.pres.model", { callId: activeTask.id });
        this.listenTo(this.model, "change", this.render);
        this.model.fetch();
      }
    },

    onEmailChange: function () {
      clearInterval(loadContactInfoInterval);
    },

    onEmailVerify: async function () {
      /**
       * Validate email and set the CAV for verify email , update contact's email if modified
       */
      contactEmail = ContactInfo.contactEmail;
      const validateEmail = (email) => {
        var validRegex = /^(?:[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
        if (email.toLowerCase().match(validRegex)) {
          return true;
        } else {
          return false;
        }
      };
      newContactEmail = $("#customer-email").val();
      if (!validateEmail(newContactEmail)) {
        $("#lbl-email-valid").css("color", "Red");
        $("#lbl-email-valid").css("display", "");
        $("#lbl-email-valid").text("Invalid Email");
        return;
      }

      const $result = $("#lbl-email-valid");
      $result.text("");
      $result.css("display", "none");

      let contactVerifiedCav = CommonFunctions.getCallVariableByName("Custom.emailVerified");
      if (!contactVerifiedCav) {
        UiApi.Logger.info("3rdPartyComp-li-call-details-bottom", "onEmailVerify", "Custom.emailVerified CAV not found");
        $("#lbl-email-valid").css("color", "Red");
        $("#lbl-email-valid").css("display", "");
        $("#lbl-email-valid").text("Verification unavailable - missing CAV");
        return;
      }
      UiApi.Logger.info("3rdPartyComp-li-call-details-bottom", "onEmailVerify", "contactVerifiedCav.id", contactVerifiedCav.id);

      const $verifyBtn = $("#verify-email");
      $verifyBtn.prop("disabled", true);
      try {
        let cavlist = [];
        cavlist.push({ id: contactVerifiedCav.id, value: true });
        // Await the CAV write so the verified state is persisted on the
        // interaction before the agent can disposition. The beforeDisposition
        // hook reads this CAV as the source of truth across browser contexts.
        await ContactInfo.setCav(ContactInfo.interactionId, cavlist);

        // Keep the legacy in-context signals for the embedded scenario.
        localStorage.setItem('emailVerificationButtonPressed', true);
        ContactInfo.emailVerificationButtonPressed = true;

        if (newContactEmail != contactEmail) {
          ContactInfo.updateContact(ContactInfo.interactionId, UiApi.Context.AgentId, newContactEmail);
          ContactInfo.contactEmail = newContactEmail;
        }
      } catch (e) {
        UiApi.Logger.info("3rdPartyComp-li-call-details-bottom", "onEmailVerify", "setCav failed", e);
        $("#lbl-email-valid").css("color", "Red");
        $("#lbl-email-valid").css("display", "");
        $("#lbl-email-valid").text("Could not save verification - please retry");
      } finally {
        $verifyBtn.prop("disabled", false);
      }
    },

    onEmailDoNotVerify: async function () {
      let contactVerifiedCav = CommonFunctions.getCallVariableByName("Custom.emailVerified");
      if (!contactVerifiedCav) {
        UiApi.Logger.info("3rdPartyComp-li-call-details-bottom", "onEmailDoNotVerify", "Custom.emailVerified CAV not found");
        $("#lbl-email-valid").css("color", "Red");
        $("#lbl-email-valid").css("display", "");
        $("#lbl-email-valid").text("Verification unavailable - missing CAV");
        return;
      }

      const $doNotVerifyBtn = $("#do-not-verify-email");
      $doNotVerifyBtn.prop("disabled", true);
      try {
        let cavlist = [];
        cavlist.push({ id: contactVerifiedCav.id, value: false });
        // Await the CAV write so the state is persisted on the interaction
        // before the agent can disposition (works across popped-out contexts).
        await ContactInfo.setCav(ContactInfo.interactionId, cavlist);

        localStorage.setItem('emailVerificationButtonPressed', true);
        ContactInfo.emailVerificationButtonPressed = true;
      } catch (e) {
        UiApi.Logger.info("3rdPartyComp-li-call-details-bottom", "onEmailDoNotVerify", "setCav failed", e);
        $("#lbl-email-valid").css("color", "Red");
        $("#lbl-email-valid").css("display", "");
        $("#lbl-email-valid").text("Could not save - please retry");
      } finally {
        $doNotVerifyBtn.prop("disabled", false);
      }
    },
  });

  return Views;
});

define('components/3rdPartyComp-li-call-details-bottom/main',["ui.api.v1", "./views/view"], function (UiApi, Views) {
  var Component = UiApi.Framework.BaseComponent.extend({
    initialize: function (options) {
      return new Views.Layout(options);
    },
  });
  return Component;
});

define('3rdparty.bundle',[
'ui.api.v1',
'handlebars',
'workflow/init'

//presentations models
,'presentation.models/li-call-details.pres.model'

//components
,'components/3rdPartyComp-li-call-details-bottom/main'

],
function (UiApi, Handlebars, Init
,Constructor0
) {

UiApi.config({showContactInfo: true});

this["JST"] = this["JST"] || {};

this["JST"]["3rdPartyComp-li-call-details-bottom"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper;

  return "<hr class=\"sfli-nav-pills-divider email-divider\">\n<div class=\"input-group email-verification\">\n  <label class=\"field-list-item-label f9-nowrap-ellipsis small\" title=\"Contact Email\">Email</label>\n  <input type=\"text\" class=\"form-control\" id=\"customer-email\" placeholder=\"Email\" aria-label=\"Contact Email\" aria-describedby=\"basic-addon2\" value=\""
    + container.escapeExpression(((helper = (helper = helpers.customerEmail || (depth0 != null ? depth0.customerEmail : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"customerEmail","hash":{},"data":data}) : helper)))
    + "\">\n  <br />\n  <label title=\"Email Validation\" id=\"lbl-email-valid\"></label>\n  <div class=\"input-group-append\">\n    <button id=\"verify-email\" class=\"btn btn-block btn-primary\">\n      Verify\n    </button>\n    <button id=\"do-not-verify-email\" class=\"btn btn-block btn-primary\">\n      Could Not Verify\n    </button>\n  </div>\n</div>";
},"useData":true});

require.config({
map: {
'*': {
}
}
});

UiApi.Logger.info('Registering 3rdparty presentation model with name li-call-details.pres.model');
UiApi.SharedPresModelRepo.registerConstructor('li-call-details.pres.model', Constructor0);

Init.initialize();
UiApi.vent.on(UiApi.PresModelEvents.WfMainOnModelLoad, function() {
Init.onModelLoad();
});
UiApi.vent.on(UiApi.PresModelEvents.WfMainOnModelUnload, function() {
Init.onModelUnload();
});
});