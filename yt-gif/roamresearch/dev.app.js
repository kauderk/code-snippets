var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
(function(factory) {
  typeof define === "function" && define.amd ? define(factory) : factory();
})(function() {
  "use strict";
  window.kauderk = {};
  window.AvoidCircularDependency = {};
  Element.prototype.queryAllasArr = Document.prototype.queryAllasArr = function(selector) {
    return Array.from(this.querySelectorAll(selector)).map(
      (el) => el
    );
  };
  const mouseOverEvents = ["mouseover"];
  const getPageUidSync = (pageTitle) => {
    const res = window.roamAlphaAPI.q(
      `[:find (pull ?page [:block/uid])
	:where [?page :node/title "${pageTitle}"]]`
    );
    return res.length ? res[0][0].uid : null;
  };
  const getOrCreatePageUid = async (pageTitle, initString) => {
    let pageUid = await getPageUid(pageTitle);
    if (!pageUid) {
      pageUid = await createPage(pageTitle);
      if (initString)
        await createChildBlock(pageUid, 0, initString, createUid());
    }
    return pageUid;
  };
  const SetNumberedViewWithUid = async (uid) => {
    const newViewType = "numbered";
    await window.roamAlphaAPI.updateBlock({
      block: { uid, "children-view-type": newViewType }
    });
  };
  const CollapseDirectcChildren = async (block_uid, block_expanded) => {
    const firstGen = await allChildrenInfo(block_uid);
    const children = sortObjectsByOrder(firstGen[0][0].children);
    for (const child of children) {
      await ExpandBlock(child.uid, block_expanded);
    }
  };
  const getBlockInfoByUIDM = async (uid, withChildren = false, withParents = false) => {
    try {
      const q = `[:find (pull ?page
					 [:node/title :block/string :block/uid :block/heading :block/props 
					  :entity/attrs :block/open :block/text-align :children/view-type
					  :block/order
					  ${withChildren ? "{:block/children ...}" : ""}
					  ${withParents ? "{:block/parents ...}" : ""}
					 ])
				  :where [?page :block/uid "${uid}"]  ]`;
      const results = await window.roamAlphaAPI.q(q);
      if (results.length == 0)
        return null;
      return results;
    } catch (e) {
      return null;
    }
  };
  const getBlockParentUids = async (uid) => {
    try {
      const parentUIDs = await window.roamAlphaAPI.q(
        `[:find (pull ?block [{:block/parents [:block/uid]}]) :in $ [?block-uid ...] :where [?block :block/uid ?block-uid]]`,
        [uid]
      )[0][0];
      const UIDS = parentUIDs.parents.map((e) => e.uid);
      UIDS.shift();
      return getPageNamesFromBlockUidList(UIDS);
    } catch (e) {
      return null;
    }
  };
  const updateBlock = async (block_uid, block_string, block_expanded = true) => {
    block_uid = block_uid.replace("((", "").replace("))", "");
    return await window.roamAlphaAPI.updateBlock({
      block: {
        uid: block_uid,
        string: block_string.toString(),
        open: block_expanded
      }
    });
  };
  const sleep$1 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const moveBlock = async (parent_uid, block_order, block_to_move_uid) => {
    return window.roamAlphaAPI.moveBlock({
      location: { "parent-uid": parent_uid, order: block_order },
      block: { uid: block_to_move_uid }
    });
  };
  const createBlock = async (parent_uid, block_order, block_string, manualUID = false) => {
    parent_uid = parent_uid.replace("((", "").replace("))", "");
    let newUid = !manualUID ? await window.roamAlphaAPI.util.generateUID() : manualUID;
    await window.roamAlphaAPI.createBlock({
      location: {
        "parent-uid": parent_uid,
        order: block_order
      },
      block: {
        string: block_string.toString(),
        uid: newUid
      }
    });
    await sleep$1(10);
    return {
      uid: newUid,
      parentUid: parent_uid,
      order: block_order,
      string: block_string
    };
  };
  const createUid = () => {
    return window.roamAlphaAPI.util.generateUID();
  };
  const getPageUid = async (pageTitle) => {
    const res = await window.roamAlphaAPI.q(
      `[:find (pull ?page [:block/uid])
	:where [?page :node/title "${pageTitle}"]]`
    );
    return res.length ? res[0][0].uid : null;
  };
  const createPage = async (pageTitle) => {
    let pageUid = createUid();
    await window.roamAlphaAPI.createPage({
      page: { title: pageTitle, uid: pageUid }
    });
    return pageUid;
  };
  const createChildBlock = async (parentUid, order, childString, childUid) => {
    return await window.roamAlphaAPI.createBlock({
      location: { "parent-uid": parentUid, order },
      block: { string: childString.toString(), uid: childUid }
    });
  };
  const allChildrenInfo = async (blockUid) => {
    let results = await window.roamAlphaAPI.q(
      `[:find (pull ?parent [* {:block/children [:block/string :block/uid :block/order]}]) :where [?parent :block/uid "${blockUid}"]]`
    );
    return results.length == 0 ? void 0 : results;
  };
  const sortObjectsByOrder = (o) => {
    return o.sort((a, b) => a.order - b.order);
  };
  const ExpandBlock = async (block_uid, block_expanded) => {
    return await window.roamAlphaAPI.updateBlock({
      block: { uid: block_uid, open: block_expanded }
    });
  };
  const getPageNamesFromBlockUidList = async (blockUidList) => {
    const rule = "[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]";
    const query = `[:find  (pull ?block [:block/uid :block/string])(pull ?page [:node/title :block/uid])
									 :in $ [?block_uid_list ...] %
									 :where
									  [?block :block/uid ?block_uid_list]
									 [?page :node/title]
									 (ancestor ?block ?page)]`;
    const results = await window.roamAlphaAPI.q(
      query,
      blockUidList,
      rule
    );
    return results;
  };
  const isBlockRef = async (uid) => {
    try {
      if (uid.startsWith("((")) {
        uid = uid.slice(2, uid.length);
        uid = uid.slice(0, -2);
      }
      const block_ref = await window.roamAlphaAPI.q(`
		  [:find (pull ?e [:block/string])
			  :where [?e :block/uid "${uid}"]]`);
      return block_ref.length > 0 && block_ref[0][0] != null ? true : false;
    } catch (e) {
      return "";
    }
  };
  const simulateMouseOver = (element) => {
    mouseOverEvents.forEach(
      (mouseEventType) => element.dispatchEvent(
        new MouseEvent(mouseEventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
        })
      )
    );
  };
  const setSideBarState = async (state) => {
    switch (state) {
      case 1:
        if (document.querySelector(".rm-open-left-sidebar-btn")) {
          simulateMouseOver(
            document.getElementsByClassName(
              "rm-open-left-sidebar-btn"
            )[0]
          );
          setTimeout(async () => {
            const el = document.getElementsByClassName(
              "rm-open-left-sidebar-btn"
            )[0];
            el.click();
          }, 100);
        }
        break;
      case 2:
        if (!document.querySelector(".rm-open-left-sidebar-btn")) {
          const el = document.querySelector(
            ".roam-sidebar-content .bp3-icon-menu-closed"
          );
          el.click();
          simulateMouseOver(
            document.getElementsByClassName("roam-article")[0]
          );
        }
        break;
      case 3:
        await window.roamAlphaAPI.ui.rightSidebar.open();
        break;
      case 4:
        await window.roamAlphaAPI.ui.rightSidebar.close();
        break;
    }
  };
  const getBlockStringByUID = async (blockUid) => {
    const info = await window.roamAlphaAPI.q(
      `[:find (pull ?b [:block/string]):where [?b :block/uid "${blockUid}"]]`
    );
    return info[0]?.[0]?.string;
  };
  const getBlockParentUids_custom = async (uid) => {
    try {
      const parentUIDs = await window.roamAlphaAPI.q(
        `[:find (pull ?block [{:block/parents [:block/uid]}]) :in $ [?block-uid ...] :where [?block :block/uid ?block-uid]]`,
        [uid]
      )[0][0];
      const UIDS = parentUIDs?.parents?.map((e) => e.uid);
      return getPageNamesFromBlockUidList(UIDS);
    } catch (e) {
      return [];
    }
  };
  const navigateToUiOrCreate = async (destinationPage, openInSideBar = false, sSidebarType = "outline") => {
    const prefix = destinationPage.substring(0, 2);
    const suffix = destinationPage.substring(
      destinationPage.length - 2,
      destinationPage.length
    );
    if (sSidebarType == "outline" && prefix == "((" && suffix == "))") {
      sSidebarType = "block";
    }
    if (prefix == "[[" && suffix == "]]" || prefix == "((" && suffix == "))") {
      destinationPage = destinationPage.substring(
        2,
        destinationPage.length - 2
      );
    }
    let uid = await getPageUid(destinationPage);
    if (uid == null) {
      uid = await getNodePageInfo(destinationPage);
      if (uid == null) {
        if (destinationPage.length > 255) {
          destinationPage = destinationPage.substring(0, 254);
        }
        await getOrCreatePageUid(destinationPage);
        await sleep2(50);
        uid = await getPageUid(destinationPage);
      } else {
        uid = destinationPage;
      }
    }
    if (openInSideBar == false) {
      document.location.href = baseUrl().href + "/" + uid;
    } else {
      await window.roamAlphaAPI.ui.rightSidebar.addWindow({
        window: {
          "block-uid": uid,
          type: sSidebarType
        }
      });
    }
    return uid;
    function sleep2(afterMiliseconds) {
      return new Promise((resolve) => setTimeout(resolve, afterMiliseconds));
    }
    function baseUrl() {
      const url2 = new URL(window.location.href);
      const parts = url2.hash.split("/");
      url2.hash = parts.slice(0, 3).concat(["page"]).join("/");
      return url2;
    }
    async function getNodePageInfo(uid2) {
      const results = await window.roamAlphaAPI.q(
        `[:find (pull ?e [ :node/title :block/string :block/children :block/uid :block/order { :block/children ... } ] ) :where [ ?e :block/uid "${uid2}" ] ]`
      );
      return results.length == 0 ? void 0 : results;
    }
  };
  const openBlockInSidebar = (blockUid, windowType = "outline") => {
    return window.roamAlphaAPI.ui.rightSidebar.addWindow({
      window: { type: windowType, "block-uid": blockUid }
    });
  };
  const fmtSplit = " : ";
  const PmtSplit = " / ";
  const cptrPrfx = "<", cptrSufx = ">";
  const chk = "checkbox", sel = "string", str = "string", pmt = "prompt", int = "integer", bol = "boolean", url = "url", rng = "range";
  function InlinePmt(blockContent = "") {
    return {
      ...BasePmt(),
      inlineObj: true,
      string: blockContent
    };
  }
  function BasePmt(blockContent = "") {
    return {
      ...baseTmp(),
      join: PmtSplit,
      inputType: pmt,
      string: blockContent
    };
  }
  function BaseSetting(inputType) {
    return baseTmp(inputType);
  }
  function BaseDom(baseValue = "", inputType) {
    return {
      ...subTemp(),
      domEl: "",
      baseValue,
      inputType,
      inlineObj: false
    };
  }
  function dom(baseValue = "", inputType = "") {
    return {
      ...subTemp(),
      domEl: "",
      baseValue,
      inputType
    };
  }
  function BaseInitSetting(baseValue = "", inputType) {
    return {
      ...subTemp(),
      baseValue,
      inputType,
      inlineObj: false
    };
  }
  function subTemp(baseValue = "", inputType) {
    return {
      ...baseTmp(inputType),
      baseValue,
      sessionValue: void 0,
      caputuredValue: "<>",
      join: fmtSplit,
      inlineObj: true,
      UpdateSettingsBlockValue: async function() {
        console.warn(
          `Update block not implemented... ${this.uid} ${this.string}`
        );
      }
    };
  }
  function baseTmp(_inputType = "", _string = "") {
    return {
      examined: false,
      uid: "",
      parentKey: "",
      string: _string,
      inputType: _inputType,
      indent: 0,
      child: 0,
      order: 0,
      inlineObj: false
    };
  }
  const YT_GIF_SETTINGS_PAGE = {
    Workflow: {
      baseKey: BasePmt(`BIP BOP . . .`),
      joins: InlinePmt(
        `either "\uFFA0:\uFFA0" for actual settings or "\uFFA0/\uFFA0" for prompt guidelines`
      ),
      parameters: {
        baseKey: BasePmt(
          "\n`(xxxuidxxx)` : `yt_gif_settings_key` : `<value>`"
        ),
        uid: InlinePmt(
          "\n`(xxxuidxxx)`\nunique per user data base, without it the settings can't be written on this page"
        ),
        key: InlinePmt(
          "\n`yt_gif_settings_key`\nsecond way to know which setting to change"
        ),
        value: InlinePmt(
          "\n`<value>`\nin many cases optional and most of the time a binary switch, on - off"
        )
      }
    },
    display: {
      baseKey: BaseSetting(chk),
      simulate_roam_research_timestamps: dom(),
      ms_options: dom("clip_lifespan_format", sel),
      fmt_options: dom("avoid_redundancy", sel),
      yt_playback_speed: dom("Default", sel)
    },
    timestamps: {
      baseKey: BaseSetting(sel),
      tm_recovery: dom("1", chk),
      tm_seek_to: dom("strict"),
      tm_restore: dom("match"),
      tm_reset_on_removal: dom("container"),
      tm_loop_hierarchy: dom("disabled"),
      tm_loop_to: dom("start"),
      tm_loop_options: dom("skip,include_player"),
      tm_seek_action: dom("disabled"),
      tm_workflow_display: dom("default"),
      tm_workflow_grab: dom("HMS"),
      tm_options: dom("")
    },
    experience: {
      baseKey: BaseSetting(sel),
      initialize_mode: dom("buffer"),
      awaiting_input_type: dom("mouseenter"),
      xp_options: dom("thumbnail_as_bg")
    },
    playerSettings: {
      baseKey: BaseSetting(sel),
      play_style: dom("strict"),
      mute_style: dom("strict"),
      fullscreen_style: dom("disabled"),
      url_boundaries: dom("strict"),
      url_volume: dom("strict"),
      ps_options: dom("mantain_last_active_player")
    },
    range: {
      baseKey: BaseSetting(rng),
      timestamp_display_scroll_offset: {
        baseKey: BaseDom("5", int),
        tdso_opt: InlinePmt(`seconds up to 60`)
      },
      end_loop_sound_volume: {
        baseKey: BaseDom("50", int),
        elsv_opt: InlinePmt(`integers from 0 to 100`)
      },
      iframe_buffer_slider: {
        baseKey: BaseDom("10", int),
        ibs_opt: InlinePmt(`integers from 1 to 30`)
      }
    },
    defaultPlayerValues: {
      baseKey: BaseSetting(),
      player_span: {
        baseKey: BaseInitSetting("50%", str),
        ps_opt: InlinePmt(
          `empty means 50% - only valid css units like px  %  vw`
        ),
        pv_opt_2: InlinePmt(
          "each block's url parameter `&sp=` has priority over this"
        )
      },
      player_volume: {
        baseKey: BaseInitSetting(40, int),
        vv_opt: InlinePmt(`integers from 0 to 100`),
        pv_opt: InlinePmt(
          "each block's url parameter `&vl=` has priority over this"
        )
      },
      player_interface_language: {
        baseKey: BaseInitSetting("en", str),
        pil_opt: InlinePmt(
          "each block's url parameter `&hl=` has priority over this"
        ),
        pli_guide: InlinePmt(
          `https://developers.google.com/youtube/player_parameters#:~:text=Sets%20the%20player%27s%20interface%20language.%20The%20parameter%20value%20is%20an%20ISO%20639-1%20two-letter%20language%20code%20or%20a%20fully%20specified%20locale.%20For%20example%2C%20fr%20and%20fr-ca%20are%20both%20valid%20values.%20Other%20language%20input%20codes%2C%20such%20as%20IETF%20language%20tags%20(BCP%2047)%20might%20also%20be%20handled%20properly.`
        )
      },
      player_captions_language: {
        baseKey: BaseInitSetting("en", str),
        pcl_opt: InlinePmt(
          "each block's url parameter `&cc=` has priority over this"
        ),
        pcl_guide: InlinePmt(
          `https://developers.google.com/youtube/player_parameters#:~:text=This%20parameter%20specifies%20the%20default%20language%20that%20the%20player%20will%20use%20to%20display%20captions.%20Set%20the%20parameter%27s%20value%20to%20an%20ISO%20639-1%20two-letter%20language%20code.`
        )
      },
      player_captions_on_load: {
        baseKey: BaseInitSetting("true", bol),
        pcol_guide: InlinePmt(
          "Browsers love to cash data... if set to -true- most certently you'll get caption on load, but it's hard to tell otherwise... Also, the mix and match of diferent `&hl=` and `&cc=` can cause to not show the captions on load"
        )
      }
    },
    defaultValues: {
      baseKey: BaseSetting(),
      override_roam_video_component: {
        baseKey: BaseInitSetting("", [bol, str]),
        orvc_opt: InlinePmt(
          'distinguish between `{{[[video]]:}}` from `{{[[yt-gif]]:}}` or "both" which is also valid'
        )
      },
      end_loop_sound_src: {
        baseKey: BaseInitSetting(
          "https://freesound.org/data/previews/256/256113_3263906-lq.mp3",
          url
        ),
        elss_opt: InlinePmt(
          `src sound when yt gif makes a loop, empty if unwanted`
        )
      },
      override_simulate_url_to_video_component: {
        baseKey: BaseInitSetting("", bol),
        orsuvc_opt: InlinePmt(
          `Because of browsers' external problems, I'd like to set this as the "usage key" replacement`
        )
      },
      YT_API_KEY_V3: {
        baseKey: BaseInitSetting("", str),
        yakv_opt: InlinePmt(``)
      },
      InAndOutKeys: {
        baseKey: BaseInitSetting("ctrlKey", str),
        iaok_opt: InlinePmt(
          `Any permutation of: altKey, shiftKey, ctrlKey 
followed by a "," coma

Middle mouse button is on by default`
        )
      }
    },
    dropdownMenu: {
      baseKey: BaseSetting(),
      ddm_css_theme_input: {
        baseKey: BaseInitSetting("", chk),
        ct_opt: InlinePmt(`"dark" == "true" or "light" == "false"`)
      }
    },
    LogStatus: {
      baseKey: BasePmt(`Everything looks alright :D`),
      DisplacedBlocks: {
        baseKey: BasePmt(
          `invalid -> settings block - deleted - deprecated
**__If you encounter any nested blocks, it's extremely advisable that you delete them__**`
        )
      },
      UnknownBlocks: {
        baseKey: BasePmt(
          `... to the YT GIF SETTINGS PAGE script algorithm-functions`
        )
      },
      ls_: InlinePmt(`End of settings`)
    }
  };
  YT_GIF_SETTINGS_PAGE.Workflow.baseKey.string = `The ${Object.keys(YT_GIF_SETTINGS_PAGE).length} blocks will be -added on updates- and -removed if deprecated- automatically. The last parameters "<>" are customizable. \u{1F415} \u{1F44B}`;
  const TARGET_PAGE = "roam/js/kauderk/yt-gif/other";
  let TARGET_UID = getPageUidSync(TARGET_PAGE);
  async function TryToSetTargetUID() {
    TARGET_UID = await getOrCreatePageUid(TARGET_PAGE);
  }
  const ObjectKeys = (o) => Object.keys(o);
  const ObjectValues = (o) => Object.values(o);
  function Clone(o, m2) {
    if ("object" !== typeof o)
      return o;
    if ("object" !== typeof m2 || null === m2)
      m2 = /* @__PURE__ */ new WeakMap();
    let n = m2.get(o);
    if ("undefined" !== typeof n)
      return n;
    let c = Object.getPrototypeOf(o).constructor;
    switch (c) {
      case Boolean:
      case Error:
      case Function:
      case Number:
      case Promise:
      case String:
      case Symbol:
      case WeakMap:
      case WeakSet:
        n = o;
        break;
      case Array:
        m2.set(o, n = o.slice(0));
        n.forEach(function(v, i) {
          if ("object" === typeof v)
            n[i] = Clone(v, m2);
        });
        break;
      case ArrayBuffer:
        m2.set(o, n = o.slice(0));
        break;
      case DataView:
        m2.set(
          o,
          n = new c(Clone(o.buffer, m2), o.byteOffset, o.byteLength)
        );
        break;
      case Map:
      case Set:
        m2.set(o, n = new c(Clone(Array.from(o.entries()), m2)));
        break;
      case Int8Array:
      case Uint8Array:
      case Uint8ClampedArray:
      case Int16Array:
      case Uint16Array:
      case Int32Array:
      case Uint32Array:
      case Float32Array:
      case Float64Array:
        m2.set(o, n = new c(Clone(o.buffer, m2), o.byteOffset, o.length));
        break;
      case Date:
      case RegExp:
        m2.set(o, n = new c(o));
        break;
      default:
        m2.set(o, n = Object.assign(new c(), o));
        for (c in n)
          if ("object" === typeof n[c])
            n[c] = Clone(n[c], m2);
    }
    return n;
  }
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  };
  const isValidUrl = (value) => {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
      value
    );
  };
  const mapRange = (value, a, b, c, d) => {
    value = (value - a) / (b - a);
    return c + value * (d - c);
  };
  const RemovedElementObserver = (options) => {
    if (!options.el) {
      return null;
    }
    const config = { subtree: true, childList: true };
    const RemovedObserver = new MutationObserver(MutationRemoval_cb);
    RemovedObserver.observe(document.body, config);
    return RemovedObserver;
    async function MutationRemoval_cb(mutationsList, observer) {
      for (const mutation of mutationsList) {
        const nodes = Array.from(mutation.removedNodes);
        const directMatch = nodes.indexOf(options.el) > -1;
        const parentMatch = nodes.some(
          (parentEl) => parentEl.contains(options.el)
        );
        if (directMatch) {
          observer.disconnect();
          if (options.directMatch)
            await options.OnRemovedFromDom_cb(observer);
          else
            console.log(`node ${options.el} was directly removed!`);
        } else if (parentMatch) {
          await options.OnRemovedFromDom_cb(observer);
          observer.disconnect();
        }
      }
    }
  };
  const assertSelector = (sel2) => {
    if (sel2.includes("@")) {
      let selArr = sel2.split(" > ");
      for (let i = 0; i < selArr.length; i++) {
        if (!selArr[i].includes("@"))
          continue;
        const rgx = new RegExp(/(@.*)\.com/, "gm");
        const replaceWith = rgx.exec(selArr[i])?.[1];
        selArr[i] = selArr[i].replace(rgx, `\\${replaceWith}\\.com`);
      }
      sel2 = selArr.join(" > ");
    }
    return sel2;
  };
  const ChangeElementType = (element, newtype) => {
    let newelement = document.createElement(newtype);
    while (element.firstChild)
      newelement.appendChild(element.firstChild);
    for (let i = 0, a = element.attributes, l = a.length; i < l; i++) {
      newelement.attributes[a[i].name] = a[i].value;
    }
    element.parentNode?.replaceChild(newelement, element);
    return newelement;
  };
  const HMSToSecondsOnly = (str2) => {
    if (/:/.test(str2)) {
      let p = str2.split(":"), s = 0, m2 = 1;
      while (p.length > 0) {
        s += m2 * parseInt(p.pop(), 10);
        m2 *= 60;
      }
      return s;
    } else if (/h|m|s/.test(str2)) {
      const hms = str2.split(/(?<=h)|(?<=m)|(?<=s)/);
      return hms.reduce((acc, crr) => {
        let t = parseInt(crr) || 0;
        if (/s/.test(crr))
          return t + acc;
        if (/m/.test(crr))
          return t * 60 + acc;
        if (/h/.test(crr))
          return t * 3600 + acc;
        return acc;
      }, 0);
    }
    return parseFloat(str2);
  };
  const toggleClasses = (bol2, classNames, el) => {
    if (bol2) {
      el.classList.add(...classNames);
    } else {
      el.classList.remove(...classNames);
    }
  };
  const removeIMGbg = (wrapper) => {
    wrapper.style.backgroundImage = "none";
  };
  const simHover = () => {
    return simMouseEvent("mouseenter");
  };
  const applyIMGbg = (wrapper, url2) => {
    wrapper.style.backgroundImage = `url(${get_youtube_thumbnail(url2)})`;
  };
  const isTrue = (value) => {
    if (typeof value === "string")
      value = value.trim().toLowerCase();
    switch (value) {
      case true:
      case "true":
      case 1:
      case "1":
      case "on":
      case "yes":
        return true;
      default:
        return false;
    }
  };
  function GetClosestRate(rates, x) {
    return [...rates].sort((a, b) => Math.abs(a - x) - Math.abs(b - x))[0];
  }
  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  const isElementVisible = (elem) => {
    const style = getComputedStyle(elem);
    if (style.display === "none")
      return false;
    if (style.visibility !== "visible")
      return false;
    if (style.opacity === 0)
      return false;
    if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height + elem.getBoundingClientRect().width === 0) {
      return false;
    }
    let elementPoints = {
      center: {
        x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
        y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
      },
      "top-left": {
        x: elem.getBoundingClientRect().left,
        y: elem.getBoundingClientRect().top
      },
      "top-right": {
        x: elem.getBoundingClientRect().right,
        y: elem.getBoundingClientRect().top
      },
      "bottom-left": {
        x: elem.getBoundingClientRect().left,
        y: elem.getBoundingClientRect().bottom
      },
      "bottom-right": {
        x: elem.getBoundingClientRect().right,
        y: elem.getBoundingClientRect().bottom
      }
    };
    for (let index in elementPoints) {
      let point = elementPoints[index];
      if (point.x < 0)
        return false;
      if (point.x > (document.documentElement.clientWidth || window.innerWidth))
        return false;
      if (point.y < 0)
        return false;
      if (point.y > (document.documentElement.clientHeight || window.innerHeight))
        return false;
      let pointContainer = document.elementFromPoint(point.x, point.y);
      if (pointContainer !== null) {
        do {
          if (pointContainer === elem)
            return true;
        } while (pointContainer = pointContainer.parentNode);
      }
    }
    return false;
  };
  const toggleAttribute = (bol2, Name, el, value = "") => {
    if (bol2) {
      el.setAttribute(Name, value);
    } else {
      el.removeAttribute(Name);
    }
  };
  const closestBlockID = (el) => {
    return el?.closest(".rm-block__input")?.id;
  };
  const getUniqueSelectorSmart = (el) => {
    const _sel = getUniqueSelector(el);
    return assertSelector(_sel);
  };
  function isRendered$1(el) {
    return document.body.contains(el);
  }
  const pushSame = (arr = Array(), el) => {
    arr.push(el);
    return arr;
  };
  const convertHMS = (value) => {
    const sec = parseInt(value.toString(), 10);
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor((sec - hours * 3600) / 60);
    let seconds = sec - hours * 3600 - minutes * 60;
    if (hours < 10) {
      hours = "0" + hours;
    }
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    return hours + ":" + minutes + ":" + seconds;
  };
  const seconds2time = (seconds, useLetters) => {
    const hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds - hours * 3600) / 60);
    const _seconds = seconds - hours * 3600 - minutes * 60;
    let time = "";
    const t = {
      h: useLetters ? "h" : ":",
      m: useLetters ? "m" : ":",
      s: useLetters ? "s" : ""
    };
    const cero = useLetters ? "" : "0";
    if (hours != 0)
      time = hours + t.h;
    if (!useLetters || minutes > 0) {
      const _minutes = minutes < 10 ? cero + minutes : String(minutes);
      time += _minutes + t.m;
    }
    if (time === "")
      time = _seconds + t.s;
    else if (!useLetters || _seconds > 0) {
      time += _seconds < 10 ? cero + _seconds : String(_seconds);
      time += t.s;
    }
    return time;
  };
  const getUniqueSelector = (el) => {
    let sSel, aAttr = ["name", "value", "title", "placeholder", "data-*"], aSel = [], getSelector = function(el2) {
      if (el2.id) {
        aSel.unshift("#" + el2.id);
        return true;
      }
      aSel.unshift(sSel = el2.nodeName.toLowerCase());
      if (el2.className) {
        aSel[0] = sSel += "." + el2.className.trim().replace(/ +/g, ".");
        if (uniqueQuery())
          return true;
      }
      for (const element of aAttr) {
        if (element === "data-*") {
          const aDataAttr = [].filter.call(
            el2.attributes,
            function(attr) {
              return attr.name.indexOf("data-") === 0;
            }
          );
          for (const element2 of aDataAttr) {
            aSel[0] = sSel += "[" + element2.name + '="' + element2.value + '"]';
            if (uniqueQuery())
              return true;
          }
        } else if (el2[element]) {
          aSel[0] = sSel += "[" + element + '="' + el2[element] + '"]';
          if (uniqueQuery())
            return true;
        }
      }
      let elChild = el2, n = 1;
      while (elChild = elChild.previousElementSibling) {
        if (elChild.nodeName === el2.nodeName)
          ++n;
      }
      aSel[0] = sSel += ":nth-of-type(" + n + ")";
      if (uniqueQuery())
        return true;
      elChild = el2;
      n = 1;
      while (elChild = elChild.previousElementSibling)
        ++n;
      aSel[0] = sSel = sSel.replace(
        /:nth-of-type\(\d+\)/,
        n > 1 ? ":nth-child(" + n + ")" : ":first-child"
      );
      if (uniqueQuery())
        return true;
      return false;
    }, uniqueQuery = function() {
      return document.querySelectorAll(aSel.join(">")).length === 1;
    };
    while (el.parentNode) {
      if (getSelector(el))
        return aSel.join(" > ");
      el = el.parentNode;
    }
  };
  const getYouTubeVideoID = (url2) => {
    const urls = url2.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return urls[2] !== void 0 ? urls[2].split(/[^0-9a-z_\-]/i)[0] : urls[0];
  };
  const fetchTextTrimed = async (url2) => {
    const str2 = await FetchText(url2);
    return trimHtml(str2);
  };
  const trimHtml = (str2) => {
    const rexp = new RegExp(">[	s\n ]*<", "g");
    return str2.replace(rexp, "><");
  };
  const isNotZoomPath = (el) => {
    return !el.closest("[class*='rm-zoom']");
  };
  const simMouseEvent = (eventName) => {
    return new MouseEvent(eventName, {
      view: window,
      bubbles: true,
      cancelable: true
    });
  };
  const simHoverOut = () => {
    return simMouseEvent("mouseleave");
  };
  const hasOneDayPassed_localStorage = (itemKey) => {
    let date = new Date().toLocaleDateString();
    if (localStorage[itemKey] == date)
      return false;
    localStorage[itemKey] = date;
    return true;
  };
  const div = (classList = Array()) => elm(classList, "div");
  const span = (classList = Array()) => elm(classList, "span");
  const elm = (classList = Array(), nodeType) => {
    const span2 = document.createElement(nodeType);
    span2.classList.add(...classList);
    return span2;
  };
  const innerElsContains = (selector, text) => {
    let elements = document.querySelectorAll(selector);
    return Array.prototype.filter.call(elements, function(element) {
      return RegExp(text).test(element.textContent);
    });
  };
  const RemoveElsEventListeners = (withEventListeners) => {
    for (const el of withEventListeners) {
      el.replaceWith(el.cloneNode(true));
    }
  };
  const RemoveAllChildren = (node) => {
    const cNode = node.cloneNode(false);
    node.parentNode?.replaceChild(cNode, node);
    return node;
  };
  const NoCash = (url2) => {
    return url2 + "?" + new Date().getTime();
  };
  const inViewportElsHard = (els) => {
    let matches = [];
    for (const el of els) {
      if (isElementVisible(el)) {
        matches.push(el);
      }
    }
    return matches;
  };
  const isValidFetch = async (url2) => {
    try {
      const response = await fetch(url2, { cache: "no-store" });
      if (!response.ok)
        throw new Error("Request failed.");
      return [response, null];
    } catch (error) {
      console.log(`Your custom link ${url2} is corrupt. ;c`);
      return [null, error];
    }
  };
  const FetchText = async (url2) => {
    const [response, err] = await isValidFetch(NoCash(url2));
    if (response)
      return await response.text();
  };
  const get_youtube_thumbnail = (url2, quality) => {
    if (url2) {
      let video_id, result;
      if (result = url2.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/)) {
        video_id = result.pop();
      } else if (result = url2.match(/youtu.be\/(.{11})/)) {
        video_id = result.pop();
      }
      if (video_id) {
        if (typeof quality == "undefined") {
          quality = "high";
        }
        let quality_key = "maxresdefault";
        if (quality == "low") {
          quality_key = "sddefault";
        } else if (quality == "medium") {
          quality_key = "mqdefault";
        } else if (quality == "high") {
          quality_key = "hqdefault";
        }
        let thumbnail2 = "https://img.youtube.com/vi/" + video_id + "/" + quality_key + ".jpg";
        return thumbnail2;
      }
    }
    return false;
  };
  const isValidCSSUnit = (value) => {
    const CssUnitTypes = [
      "em",
      "ex",
      "ch",
      "rem",
      "vw",
      "vh",
      "vmin",
      "vmax",
      "%",
      "cm",
      "mm",
      "in",
      "px",
      "pt",
      "pc"
    ];
    const regexps = CssUnitTypes.map((unit) => {
      return new RegExp(`^[0-9]+${unit}$|^[0-9]+\\.[0-9]+${unit}$`, "i");
    });
    const isValid = regexps.find((regexp) => regexp.test(value)) !== void 0;
    return isValid;
  };
  class ILoop {
    constructor() {
      __publicField(this, "parentKey", "");
      __publicField(this, "indent", -1);
      __publicField(this, "accStr", "");
      __publicField(this, "nextStr", "");
      __publicField(this, "inputTypeFromBaseKey", "");
      __publicField(this, "accKeys", []);
    }
  }
  async function pageShape2BlockMap(page) {
    const keyObjMap = /* @__PURE__ */ new Map();
    const passAccObj = new ILoop();
    const _page = Clone(page);
    return {
      pageAsText: await Rec_PageShape2BlockMap(_page, passAccObj, keyObjMap),
      keyObjMap,
      page: _page
    };
  }
  async function Rec_PageShape2BlockMap(nextObj, accObj, map) {
    let { accStr } = accObj;
    let funcGeneralOrder = -1;
    const { nextStr, indent } = accObj;
    const tab = `	`.repeat(indent < 0 ? 0 : indent);
    accStr = accStr + "\n" + tab + nextStr;
    for (const key in nextObj) {
      const RAW_OBJ = nextObj[key];
      if (!isAnObjectWith$1(nextObj, RAW_OBJ, key))
        continue;
      const nextAccObj = {
        parentKey: key,
        indent: indent + 1,
        inputTypeFromBaseKey: RAW_OBJ?.baseKey?.inputType,
        accStr,
        nextStr: RAW_OBJ.string || ""
      };
      if (key != "baseKey") {
        map.set(key, PassDirectSetting(RAW_OBJ, accObj));
      }
      accStr = await Rec_PageShape2BlockMap(nextObj[key], nextAccObj, map);
      const getAssignObj = () => ({
        indent: nextAccObj.indent,
        order: Number(++funcGeneralOrder)
      });
      if (RAW_OBJ.baseKey != void 0) {
        AssignBaseObj(RAW_OBJ, getAssignObj());
      } else if (RAW_OBJ.inlineObj == true) {
        AssignInlineObj(RAW_OBJ, {
          ...getAssignObj(),
          inputTypeFromBaseKey: accObj.inputTypeFromBaseKey
        });
      }
    }
    return accStr;
  }
  function AssignInlineObj(RAW_OBJ, obj) {
    RAW_OBJ.order = obj.order;
    RAW_OBJ.indent = obj.indent;
    RAW_OBJ.inputType = RAW_OBJ.inputType ? RAW_OBJ.inputType : obj.inputTypeFromBaseKey;
  }
  function AssignBaseObj(RAW_OBJ, obj) {
    RAW_OBJ.baseKey.order = obj.order;
    RAW_OBJ.baseKey.indent = obj.indent;
  }
  function PassDirectSetting(RAW_OBJ, accObj) {
    const direct = RAW_OBJ?.baseKey ? RAW_OBJ.baseKey : RAW_OBJ;
    direct.parentKey = accObj.parentKey || TARGET_PAGE;
    if (direct.UpdateSettingsBlockValue) {
      direct.UpdateSettingsBlockValue = ClosureSettingsBlock(direct);
    }
    return direct;
  }
  function ClosureSettingsBlock(RAW_OBJ) {
    return async function(replaceWith) {
      const rgxValue = new RegExp(/<(.*?)>/, "gm");
      const postChange = RAW_OBJ.string.replace(rgxValue, `<${replaceWith}>`);
      if (postChange != RAW_OBJ.string) {
        RAW_OBJ.string = postChange;
        RAW_OBJ.sessionValue = replaceWith;
        await updateBlock(RAW_OBJ.uid, RAW_OBJ.string);
      }
    };
  }
  function isAnObjectWith$1(nextObj, target, key) {
    return nextObj.hasOwnProperty(key) && target && typeof target === "object" && !(target instanceof Array);
  }
  function AssignExamineProperty(baseKeyObj, string, uid) {
    return Object.assign(baseKeyObj, {
      examined: true,
      uid,
      string
    });
  }
  async function checkReorderBlockObj(parentUid, selfOrder, childObjToMoveUID) {
    const validOrder = childObjToMoveUID.order;
    const validUid = childObjToMoveUID.uid;
    try {
      if (parentUid == validUid) {
        throw new Error(
          `STOP! Don't move block to itself =>         ${parentUid} ${childObjToMoveUID.string}`
        );
      }
      if (selfOrder != validOrder) {
        debugger;
        await moveBlock(parentUid, validOrder, validUid);
      }
    } catch (err) {
      debugger;
    }
  }
  Array.prototype.Last = function() {
    return this[this.length - 1];
  };
  class IBaseAcc {
    constructor() {
      __publicField(this, "accStr", "");
      __publicField(this, "nextStr", "");
      __publicField(this, "accKeys", []);
      __publicField(this, "accHierarchyUids", []);
      __publicField(this, "parentKey", "");
      __publicField(this, "tab", "");
      __publicField(this, "appenAccStr", appenAccStr);
    }
  }
  async function CreateMissingBLocks(page) {
    const ACC_OBJ = new IBaseAcc();
    return await Rec_CreateMissingBLocks(page, ACC_OBJ);
  }
  async function Rec_CreateMissingBLocks(nextObj, accObj) {
    let { accStr } = accObj;
    accStr = accObj.appenAccStr();
    let hierarchyUids = Array();
    for (const key in nextObj) {
      let RAW_OBJ = nextObj[key];
      if (!isAnObjectWith(RAW_OBJ, key, nextObj))
        continue;
      if (key == "baseKey") {
        if (RAW_OBJ.examined == false)
          RAW_OBJ = await createBaseKey(RAW_OBJ, accObj);
        hierarchyUids = [...hierarchyUids, RAW_OBJ?.uid];
      }
      const nextAccObj = {
        parentKey: key,
        accKeys: [...accObj.accKeys, key],
        accHierarchyUids: [...accObj.accHierarchyUids, ...hierarchyUids],
        accStr,
        nextStr: RAW_OBJ.string || "",
        appenAccStr,
        tab: ""
      };
      accStr = await Rec_CreateMissingBLocks(nextObj[key], nextAccObj);
      if (RAW_OBJ.examined == false) {
        RAW_OBJ = await createInlineSetting(
          nextAccObj,
          RAW_OBJ,
          hierarchyUids.Last()
        );
      }
    }
    return accStr;
  }
  async function createBaseKey(nestedPpt, accObj) {
    let preStr;
    const prntKeyToInlineKey = accObj.parentKey;
    if (nestedPpt.baseValue != void 0) {
      preStr = validThirdParameterSplit(nestedPpt);
    } else {
      preStr = nestedPpt.string;
    }
    const manualStt = {
      m_uid: accObj.accHierarchyUids.Last() || TARGET_UID,
      m_strArr: preStr ? [prntKeyToInlineKey, preStr] : [prntKeyToInlineKey],
      m_order: nestedPpt.order
    };
    nestedPpt = await UIBlockCreation(nestedPpt, manualStt);
    return nestedPpt;
  }
  function isAnObjectWith(nestedPpt, property, nextObj) {
    return nextObj.hasOwnProperty(property) && typeof nextObj[property] === "object" && nextObj[property] != null && !(nestedPpt instanceof Array);
  }
  async function createInlineSetting(nextAccObj, nestedPpt, m_uid) {
    const manualStt = {
      m_uid,
      m_strArr: [
        nextAccObj.accKeys.Last(),
        validThirdParameterSplit(nestedPpt)
      ],
      m_order: nestedPpt.order
    };
    nestedPpt = await UIBlockCreation(nestedPpt, manualStt);
    return nestedPpt;
  }
  async function UIBlockCreation(keyObj, manual) {
    const { m_order, m_uid, m_join, m_strArr } = manual;
    const { uid, string } = fmtSettings(m_strArr, m_join || keyObj.join);
    const { order: selfOrder } = keyObj;
    await createBlock(
      m_uid || TARGET_UID,
      m_order || selfOrder || 1e4,
      string,
      uid
    );
    await checkReorderBlockObj(m_uid, m_order, keyObj);
    return AssignExamineProperty(keyObj, string, uid);
    function fmtSettings(strArr, splitter = fmtSplit) {
      const manualUID = createUid();
      const preBlockStr = [`(${manualUID})`, ...strArr];
      const blockStr = preBlockStr.join(splitter);
      return {
        uid: manualUID,
        string: blockStr
      };
    }
  }
  function validThirdParameterSplit(nestedPpt) {
    if (nestedPpt.join == fmtSplit) {
      const value = nestedPpt.sessionValue = nestedPpt.baseValue;
      return nestedPpt.caputuredValue = `${cptrPrfx}${value}${cptrSufx}`;
    }
    return nestedPpt.string;
  }
  function appenAccStr() {
    return this.accStr + "\n" + this.nextStr;
  }
  class TAcc {
    constructor() {
      __publicField(this, "keyFromLevel0", "");
      __publicField(this, "selfOrder", 0);
    }
  }
  class TRes {
    constructor() {
      __publicField(this, "accStr", "");
      __publicField(this, "keyObjMap", /* @__PURE__ */ new Map());
      __publicField(this, "pendingBLocks2Displace", []);
      __publicField(this, "singleKeyEntries", []);
    }
  }
  async function Read_Write_SettingsPage(UID, keyObjMap = /* @__PURE__ */ new Map()) {
    keyObjMap.set(TARGET_PAGE, { uid: TARGET_UID });
    const ChildrenHierarchy = await getBlockInfoByUIDM(UID, true);
    const accObj = new TAcc();
    let accRes = { ...new TRes(), keyObjMap };
    if (!ChildrenHierarchy) {
      console.error(`No ChildrenHierarchy for uid: ${UID}`);
      return accRes.pendingBLocks2Displace;
    }
    accRes = await Rec_Read_Write_SettingsPage(
      ChildrenHierarchy[0][0],
      accObj,
      accRes
    );
    return accRes.pendingBLocks2Displace;
  }
  async function Rec_Read_Write_SettingsPage(blockInfo, accObj, accRes) {
    const nextStr = blockInfo.string || blockInfo.title || "";
    let parentState = {
      displaced: false,
      overrideKey: null
    };
    const keywords = getKeywordsFromBlockString(nextStr);
    const readKeys = { ...keywords, nextStr, crrUID: blockInfo.uid };
    const writeKeys = { ...keywords };
    const parentKeys = {
      uid: () => keywords.uid,
      indent: () => position.indent,
      get: () => parentState,
      accObj: () => accObj
    };
    const mapObj = {
      key: keywords.key,
      map: accRes.keyObjMap,
      has: (k) => accRes.keyObjMap.has(k ?? mapObj.key),
      get: (k) => accRes.keyObjMap.get(k ?? mapObj.key),
      crrUID: blockInfo.uid
    };
    const position = await RelativeChildInfo(mapObj);
    const TRY = await ValidateTargetBlockObj(mapObj, accRes.singleKeyEntries, readKeys, blockInfo, parentState);
    const credentials = TRY.credentials ?? await ReadWriteBlock(readKeys, writeKeys, TRY.block);
    if (TRY.block) {
      const ok = validNestFromThePast(TRY.block, parentKeys);
      accRes.pendingBLocks2Displace.push(
        async () => OrderPossiblyMistakenBlock(ok, TRY.block, parentKeys, mapObj)
      );
    }
    if (credentials.success) {
      accRes.accStr = accRes.accStr + "\n" + position.tab + nextStr;
    } else if (wrongBlock(credentials)) {
      const asyncFunc = HandleFutureMove(credentials.outUid, parentKeys, readKeys, mapObj);
      if (asyncFunc) {
        accRes.pendingBLocks2Displace.push(asyncFunc);
      }
    }
    for (const child of blockInfo.children ?? []) {
      const nextAccObj = {
        keyFromLevel0: blockInfo.overrideKey || keywords.key || TARGET_PAGE,
        selfOrder: child.order
      };
      accRes = await Rec_Read_Write_SettingsPage(child, nextAccObj, accRes);
    }
    return accRes;
  }
  function wrongBlock(c) {
    return c.outUid != TARGET_UID && c.outKey != TARGET_PAGE;
  }
  function getKeywordsFromBlockString(nextStr) {
    const rgxUid = new RegExp(/\(([^\)]+)\)/, "gm");
    const join = includesAtlest(nextStr, [PmtSplit, fmtSplit]);
    const splitedStrArr = nextStr.split(join);
    const everyFirstKeyword = splitedStrArr.map((word) => word.split(" ")[0]);
    const preUid = rgxUid.exec(everyFirstKeyword[0]);
    const p_uid = preUid?.[1];
    const { value, caputureValueOk } = tryTrimCapturedValue(
      everyFirstKeyword[2] || ""
    );
    return {
      uid: p_uid,
      key: everyFirstKeyword[1],
      caputuredValue: everyFirstKeyword[2],
      value,
      caputureValueOk,
      splitedStrArr,
      join
    };
  }
  function tryTrimCapturedValue(string) {
    const prefix = string.substring(0, 1);
    const suffix = string.substring(string.length - 1, string.length);
    if (prefix == cptrPrfx && suffix == cptrSufx) {
      return {
        value: string.substring(1, string.length - 1),
        caputureValueOk: true
      };
    }
    return {
      value: string,
      caputureValueOk: false
    };
  }
  function includesAtlest(string, Arr) {
    const match = Arr.filter((s) => string.includes(s));
    return match.length > 0 ? match[0] : fmtSplit;
  }
  async function RelativeChildInfo(mapObj) {
    const tab = "	";
    let position = { indent: 0, parentUid: "" };
    if (mapObj.has()) {
      const searchBlock = mapObj.get();
      position = mapObj.map.has(searchBlock.parentKey) ? HandleNewParentUID(searchBlock, mapObj) : await getRelativeInfoAsync(mapObj.crrUID);
    }
    if (!position.parentUid)
      position = await getRelativeInfoAsync(mapObj.crrUID);
    return {
      tab: tab.repeat(position.indent),
      ...position
    };
  }
  function HandleNewParentUID(searchBlock, mapObj) {
    return {
      indent: searchBlock.indent,
      parentUid: mapObj.get(searchBlock.parentKey)?.uid ?? ""
    };
  }
  async function getRelativeInfoAsync(crrUID) {
    let parentsHierarchy = await getBlockParentUids(crrUID);
    return {
      indent: parentsHierarchy?.length ?? 0,
      parentUid: parentsHierarchy ? parentsHierarchy[0]?.[0].uid : TARGET_UID
    };
  }
  async function ReadWriteBlock(readKeys, writeKeys, block) {
    const { key, nextStr, uid, crrUID, join, splitedStrArr } = readKeys;
    let p_string = nextStr;
    const { v_uid, uidOk } = await validateBlockUid(uid, crrUID);
    const { v_string, stringOK } = await validateBlockContent(
      block,
      splitedStrArr
    );
    if (!uidOk || !stringOK) {
      p_string = await UpdateRoamBlock_Settings(key, readKeys, v_string);
    }
    AssignExamineProperty(block, p_string, v_uid);
    if (join == fmtSplit && block.hasOwnProperty("sessionValue")) {
      Object.assign(block, UpdateInlineObj(writeKeys, block));
    }
    return {
      success: true,
      outKey: key,
      outUid: v_uid
    };
  }
  async function ValidateTargetBlockObj(mapObj, singleKeyEntries, readKeys, blockInfo, parentState) {
    const credentials = {
      success: false,
      outKey: mapObj.key,
      outUid: mapObj.crrUID
    };
    if (mapObj.key && singleKeyEntries.includes(mapObj.key)) {
      if (mapObj.has()) {
        const invalidKey = `${mapObj.key}`.concat("_InvalidDuplicate");
        const n_string = await UpdateRoamBlock_Settings(
          invalidKey,
          readKeys
        );
        debugger;
        blockInfo.string = n_string;
        parentState.overrideKey = invalidKey;
        blockInfo.overrideKey = invalidKey;
        return {
          block: null,
          credentials: {
            ...credentials,
            outKey: invalidKey
          }
        };
      }
    }
    singleKeyEntries.push(mapObj.key);
    const block = mapObj.get();
    if (!(block && mapObj.key != TARGET_PAGE))
      return {
        block: null,
        credentials
      };
    return {
      block,
      credentials: null
    };
  }
  async function validateBlockUid(caputuredUID, crrUID) {
    const uidOk = caputuredUID == crrUID;
    const v_uid = uidOk ? caputuredUID : crrUID;
    return {
      uidOk,
      v_uid
    };
  }
  async function validateBlockContent(obj, splitedStrArr) {
    const caputuredString = splitedStrArr[2] || "";
    let v_string = caputuredString;
    let stringOK = true;
    if (obj.string != caputuredString && obj.join == PmtSplit) {
      if (obj.uid != "" || obj.string.includes(" / ") || splitedStrArr[3] != void 0) {
        debugger;
        throw new Error(
          `YT GIF Settings Page: STOP! the string is invalid or was already set...`
        );
      }
      v_string = obj.string;
      stringOK = false;
    }
    return {
      v_string,
      stringOK
    };
  }
  async function UpdateRoamBlock_Settings(newKey, readKeys, newString) {
    const { nextStr, uid, crrUID, join, splitedStrArr } = readKeys;
    splitedStrArr.splice(0, 1, `(${crrUID})`);
    splitedStrArr.splice(1, 1, newKey);
    if (newString) {
      splitedStrArr.splice(2, 1, newString);
    }
    const v_string = splitedStrArr.join(join || PmtSplit);
    await updateBlock(crrUID, v_string);
    await sleep$1(50);
    console.log(
      `Updating block  ((${uid})) -> 
 ${nextStr} 

to ((${crrUID})) -> 
\uFFA0
${v_string}`
    );
    return v_string;
  }
  function UpdateInlineObj(writeKeys, crrObjKey) {
    crrObjKey.sessionValue = writeKeys.value;
    crrObjKey.caputuredValue = writeKeys.caputuredValue;
    if (crrObjKey.inputType == int) {
      crrObjKey.sessionValue = parseInt(crrObjKey.sessionValue, 10);
    }
    return crrObjKey;
  }
  async function OrderPossiblyMistakenBlock(validNestFromThePast2, block, parentKey, mapObj) {
    const relevantParentUID = validNestFromThePast2 ? parentKey.uid() : mapObj.get(block.parentKey)?.uid;
    if (parentKey.get().displaced == false) {
      await TryToMoveBlock(relevantParentUID, block.order, block.uid);
      if (parentKey.accObj().keyFromLevel0 != block.parentKey) {
        await TryToMoveBlock(
          mapObj.get(block.parentKey)?.uid,
          block.order,
          block.uid
        );
      }
    }
  }
  function validNestFromThePast(block, parentKey) {
    const ok = isOrderOk(block, parentKey);
    if (ok) {
      parentKey.get().displaced = true;
    }
    return ok;
  }
  function isOrderOk(targeObj, parentKeys) {
    return targeObj.indent == parentKeys.indent() && parentKeys.accObj().selfOrder == targeObj.order && parentKeys.accObj().keyFromLevel0 == targeObj.parentKey;
  }
  function HandleFutureMove(uidToMove, parentKey, readKeys, mapObj) {
    if (!uidToMove)
      throw new Error(
        `YT GIF Settings Page: STOP! a future block will try to move to an undefined place`
      );
    let Recycle_cb = null;
    if (parentKey.accObj().keyFromLevel0 == "LogStatus") {
      return null;
    }
    if (parentKey.accObj().keyFromLevel0 != "DisplacedBlocks" && mapObj.key) {
      Recycle_cb = async () => TryToMoveBlock(mapObj.get("DisplacedBlocks")?.uid, 0, uidToMove);
    } else if (parentKey.accObj().keyFromLevel0 != "UnknownBlocks" && !readKeys.nextStr.includes(readKeys.join)) {
      Recycle_cb = async () => TryToMoveBlock(mapObj.get("UnknownBlocks")?.uid, 0, uidToMove);
    }
    parentKey.get().displaced = true;
    return Recycle_cb;
  }
  async function TryToMoveBlock(parentUid, order, selfUid) {
    try {
      if (parentUid && selfUid && parentUid == selfUid) {
        throw new Error(
          `YT GIF Settings Page: STOP! Don't move block to itself =>         ${parentUid} ${selfUid}`
        );
      }
      if (!parentUid)
        return;
      moveBlock(parentUid, order, selfUid);
    } catch (err) {
      debugger;
    }
  }
  window.YT_GIF_DIRECT_SETTINGS = /* @__PURE__ */ new Map();
  async function init$1() {
    const res = await pageShape2BlockMap(YT_GIF_SETTINGS_PAGE);
    if (!TARGET_UID) {
      await TryToSetTargetUID();
      await CreateMissingBLocks(res.page);
      await SetNumberedViewWithUid(TARGET_UID);
      await CollapseDirectcChildren(TARGET_UID, false);
    } else {
      const pendingBLocks2Displace = await Read_Write_SettingsPage(TARGET_UID, res.keyObjMap);
      await CreateMissingBLocks(res.page);
      for (const cb_closure of pendingBLocks2Displace)
        await cb_closure();
    }
    window.YT_GIF_DIRECT_SETTINGS = res.keyObjMap;
    return res.page;
  }
  const urlFolder = (f) => `https://kauderk.github.io/yt-gif-extension/resources/${f}`;
  const self_urlFolder = (f) => `https://kauderk.github.io/yt-gif-extension/v0.2.0/${f}`;
  const urlFolder_css = (f) => urlFolder(`css/${f}`);
  const urlFolder_js = (f) => urlFolder(`js/${f}`);
  const links = {
    css: {
      dropDownMenuStyle: urlFolder_css("drop-down-menu.css"),
      playerStyle: urlFolder_css("player.css"),
      themes: {
        dark: urlFolder_css("themes/dark-drop-down-menu.css"),
        light: urlFolder_css("themes/light-drop-down-menu.css"),
        get: function(i) {
          return this.toogle(!isTrue(i));
        },
        toogle: function(t) {
          return isTrue(t) ? this.dark : this.light;
        }
      }
    },
    html: {
      dropDownMenu: self_urlFolder("html/drop-down-menu.html"),
      playerControls: self_urlFolder("html/player-controls.html"),
      urlBtn: self_urlFolder("html/url-btn.html"),
      anchor: self_urlFolder("html/yt-gif-anchor.html"),
      insertOptions: self_urlFolder("html/insert-options.html"),
      fetched: {
        playerControls: "",
        urlBtn: "",
        anchor: "",
        insertOptions: ""
      }
    },
    js: {
      utils: urlFolder_js("js"),
      roamAlphaApi: urlFolder_js("utils-roam-alpha-api.js"),
      settingsPage: self_urlFolder("js/settings-page.js"),
      main: self_urlFolder("js/yt-gif-main.js")
    },
    help: {
      github_isuues: `https://github.com/kauderk/kauderk.github.io/issues`
    }
  };
  const cssData = {
    yt_gif: "yt-gif",
    yt_gif_wrapper: "yt-gif-wrapper",
    yg_wrapper_p: "yt-gif-wrapper-parent",
    yt_gif_iframe_wrapper: "yt-gif-iframe-wrapper",
    yt_gif_timestamp: "yt-gif-timestamp",
    yt_gif_audio: "yt-gif-audio",
    yt_gif_custom_player_span_first_usage: "ty-gif-custom-player-span-first-usage",
    awiting_player_pulse_anim: "yt-gif-awaiting-palyer--pulse-animation",
    awaitng_player_user_input: "yt-gif-awaiting-for-user-input",
    awaitng_input_with_thumbnail: "yt-gif-awaiting-for-user-input-with-thumbnail",
    ddm_icon: "ty-gif-icon",
    dwn_no_input: "dropdown_not-allowed_input",
    dropdown_fadeIt_bg_animation: "dropdown_fadeIt-bg_animation",
    dropdown_forbidden_input: "dropdown_forbidden-input",
    dropdown_allright_input: "dropdown_allright-input",
    dropdown__hidden: "dropdown--hidden",
    dropdown_deployment_style: "dropdown_deployment-style",
    dwp_message: "dropdown-info-message",
    ddm_info_message_selector: `.dropdown .dropdown-info-message`,
    dwn_pulse_anim: "drodown_item-pulse-animation",
    ddm_exist: "yt-gif-drop-down-menu-toolbar",
    ddm_focus: "dropdown-focus",
    stt_allow: "settings-not-allowed",
    ditem_allow: "dropdown-item_not-allowed_input",
    p_controls: "yt-gif-controls",
    ddn_tut_awaiting: "ddm-tut-awaiting-input",
    id: {
      navigate_btn: "#navigate-to-yt-gif-settings-page",
      toogle_theme: "#yt-gif-ddm-theme",
      ddm_main_theme: "#yt-gif-ddm-main-theme"
    },
    raw_anchorSel: "rm-xparser-default-anchor"
  };
  const attrData = {
    "initialize-mode": "",
    "timestamp-experience": "",
    "timestamp-loop-opt": "",
    ms_options: "",
    fmt_options: ""
  };
  const attrInfo = {
    url: {
      path: "data-video-url",
      index: "data-video-index"
    },
    target: "data-target",
    uid: "data-uid",
    creation: {
      name: "data-creation",
      forceAwaiting: "force-awaiting",
      cleaning: "cleaning",
      displaced: "displaced",
      buffer: "buffer"
    }
  };
  const ytGifAttr = {
    sound: {
      mute: "yt-mute",
      unMute: "yt-unmute"
    },
    play: {
      playing: "yt-playing",
      paused: "yt-paused"
    },
    extra: {
      readyToEnable: "readyToEnable"
    }
  };
  function isSelected(select, ...value) {
    return Array.from(select.selectedOptions).find(
      (o) => value.includes(o.value)
    );
  }
  function getOption(select, value) {
    return Array.from(select.options).find(
      (o) => o.value == value
    );
  }
  class Wild_Config {
  }
  __publicField(Wild_Config, "componentPage", "[^:]+");
  __publicField(Wild_Config, "targetStringRgx", /{{([^}]*)/gm);
  function properBlockIDSufix(url2, urlIndex) {
    return "_" + [url2, urlIndex].join("_");
  }
  function preRgxComp(rgxPage) {
    return `{{(\\[\\[)?(${rgxPage})((?=:):|[^:|\\/]+?(:))(|[^{]+)}}`;
  }
  function BlockRegexObj(componentPage = Wild_Config.componentPage, targetStringRgx) {
    const componentRgx = new RegExp(preRgxComp(componentPage), "gm");
    const anyPossibleComponentsRgx = Wild_Config.targetStringRgx;
    const aliasPlusUidsRgx = /\[(.*?(?=\]))]\(\(\((.*?(?=\)))\)\)\)/gm;
    const tooltipCardRgx = /{{=:(.+?)\|([^}]*)/gm;
    const anyUidRgx = /(?<=\(\()([^(].*?[^)])(?=\)\))/gm;
    const baseBlockRgx = [
      tooltipCardRgx,
      componentRgx,
      anyPossibleComponentsRgx,
      aliasPlusUidsRgx,
      anyUidRgx
    ];
    if (targetStringRgx)
      baseBlockRgx.push(targetStringRgx);
    const blockRgx = reduceRgxArr(baseBlockRgx);
    return {
      blockRgx,
      aliasPlusUidsRgx,
      tooltipCardRgx,
      anyPossibleComponentsRgx,
      componentRgx,
      anyUidRgx
    };
  }
  function reduceRgxArr(regexArr) {
    return regexArr.reduce(
      (acc, v, i, a) => new RegExp(
        acc.source != "(?:)" ? acc.source + "|" + v.source : v.source,
        "gm"
      ),
      new RegExp()
    );
  }
  function floatParam(p, url2) {
    const raw = paramRgx(p)?.exec(url2)?.[2];
    return raw ? time2sec(raw) : 0;
  }
  function time2sec(raw) {
    if (/[hms]/.test(raw)) {
      const hms = raw.split(/(?<=h)|(?<=m)|(?<=s)/);
      return hms.reduce((acc, crr) => {
        const t = parseInt(crr) || 0;
        if (/s/.test(crr))
          return t + acc;
        if (/m/.test(crr))
          return t * 60 + acc;
        if (/h/.test(crr))
          return t * 3600 + acc;
        return acc;
      }, 0);
    }
    return parseFloat(raw);
  }
  function paramRgx(p, f = "gm") {
    return new RegExp(`((?:${p})=)(([^&]+))`, f);
  }
  function CleanAndBrandNewWrapper(wrapper_p, attr_name = attrInfo.creation.name, attr_value = "") {
    const targetClass = wrapper_p.getAttribute(`${attrInfo.target}`);
    const parentSel = getUniqueSelectorSmart(wrapper_p.parentNode);
    wrapper_p.parentNode?.removeChild(wrapper_p);
    const el = div([targetClass]);
    toggleAttribute(true, attr_name, el, attr_value);
    document.querySelector(parentSel)?.appendChild(el);
    return el;
  }
  let UI$1 = {};
  const iframeIDprfx = "player_";
  let currentFullscreenPlayer;
  const setCurrentFullscreenPlayer = (id) => currentFullscreenPlayer = id;
  const YT_GIF_OBSERVERS_TEMP = {
    masterMutationObservers: Array(),
    masterIntersectionObservers: Array(),
    masterIntersectionObservers_buffer: Array(),
    masterIframeBuffer: Array(),
    timestampObserver: null,
    keyupEventHandler: (e) => {
    },
    creationCounter: -1,
    CleanMasterObservers: function() {
      const mutObjRes = cleanObserverArr(this.masterMutationObservers);
      this.masterMutationObservers = mutObjRes.observer;
      const insObjRes = cleanObserverArr(this.masterIntersectionObservers);
      this.masterIntersectionObservers = insObjRes.observer;
      const bufObjRes = cleanObserverArr(
        this.masterIntersectionObservers_buffer
      );
      this.masterIntersectionObservers_buffer = insObjRes.observer;
      console.log(
        `${mutObjRes.counter} mutation, ${insObjRes.counter} intersection and ${bufObjRes.counter} iframe buffer master observers cleaned`
      );
      function cleanObserverArr(observer) {
        let counter = 0;
        for (let i = observer.length - 1; i >= 0; i--) {
          observer[i].disconnect();
          observer.splice(i, 1);
          counter++;
        }
        return {
          observer,
          counter
        };
      }
    },
    CleanLoadedWrappers: function() {
      const wrappers = document.queryAllasArr(`[${attrInfo.target}]`);
      for (let i = wrappers.length - 1; i >= 0; i--) {
        CleanAndBrandNewWrapper(
          document.querySelector(
            getUniqueSelectorSmart(wrappers[i])
          ),
          attrInfo.creation.name,
          attrInfo.creation.cleaning
        );
      }
    },
    dmm_html: window.ddm_html
  };
  window.YT_GIF_OBSERVERS = !window.YT_GIF_OBSERVERS ? YT_GIF_OBSERVERS_TEMP : window.YT_GIF_OBSERVERS;
  function TryCreateUserInputObject(YT_GIF_SETTINGS_PAGE2) {
    return UI$1 = JSON.parse(
      JSON.stringify(
        Object.assign(YT_GIF_SETTINGS_PAGE2, {
          deploymentStyle: {
            suspend_yt_gif_deployment: "",
            deployment_style_yt_gif: "1",
            deployment_style_video: "",
            deployment_style_both: "",
            deploy_yt_gifs: ""
          }
        })
      )
    );
  }
  function GetPlayerState() {
    return window.YT.PlayerState;
  }
  function set(arg) {
    if (typeof arg === "function") {
      this.value = arg(this.value);
    } else {
      this.value = arg;
    }
  }
  function setDefault(arg) {
    this.value = arg;
    this.default = arg;
  }
  class Param {
    constructor(_value, args) {
      __publicField(this, "value");
      __publicField(this, "alias");
      __publicField(this, "set", set);
      this.value = args?.value ?? _value;
      this.alias = args?.alias ?? [];
    }
  }
  class NumHistory extends Param {
    constructor(args) {
      super(0, args);
      __publicField(this, "update", this.value);
      __publicField(this, "history", []);
    }
  }
  class TNumParam extends Param {
    constructor(args) {
      super(0, args);
      __publicField(this, "default", this.value);
      __publicField(this, "setDefault", setDefault);
    }
  }
  class StrParam extends Param {
    constructor(args) {
      super("", args);
    }
  }
  class BolParam extends Param {
    constructor(args) {
      super(false, args);
    }
  }
  const getPlayerVol = () => window.YT_GIF_DIRECT_SETTINGS.get("player_volume")?.sessionValue;
  class TVideoParams {
    constructor() {
      __publicField(this, "id", new StrParam({ value: "---------" }));
      __publicField(this, "src", new StrParam({
        value: "https://www.youtube.com/embed/---------?"
      }));
      __publicField(this, "speed", new TNumParam({ value: 1, alias: ["s"] }));
      __publicField(this, "start", new TNumParam({ alias: ["t"] }));
      __publicField(this, "end", new TNumParam());
      __publicField(this, "updateTime", new TNumParam());
      __publicField(this, "timestamps", new NumHistory());
      __publicField(this, "volume", new NumHistory({ value: getPlayerVol(), alias: ["vl"] }));
    }
  }
  class IExtendedVideoParams extends TVideoParams {
    constructor() {
      super(...arguments);
      __publicField(this, "hl", new StrParam());
      __publicField(this, "cc", new StrParam());
      __publicField(this, "sp", new StrParam());
      __publicField(this, "mute", new BolParam());
      __publicField(this, "playRightAway", new BolParam());
    }
  }
  const NotImplementationWarning = () => {
    console.warn("Not implemented");
    return {};
  };
  class T_YT_RECORD {
    constructor(wTarget) {
      __publicField(this, "wTarget");
      __publicField(this, "uid", "");
      __publicField(this, "seekToUpdatedTime", NotImplementationWarning);
      __publicField(this, "sameBoundaries", NotImplementationWarning);
      __publicField(this, "isSoundingFine", NotImplementationWarning);
      __publicField(this, "togglePlay", NotImplementationWarning);
      __publicField(this, "bounded", NotImplementationWarning);
      this.wTarget = wTarget;
    }
  }
  class YT_TargetWrapper {
    constructor(target) {
      __publicField(this, "t");
      __publicField(this, "ytgif");
      __publicField(this, "GetIframeID", () => this.t.i?.id || this.t.g?.id || this.t.getIframe()?.id);
      __publicField(this, "GetVideoID", () => this.t.j.i.videoId);
      __publicField(this, "GetVars", () => this.t.j.i.playerVars);
      __publicField(this, "ApiIsWorking", () => this.t.seekTo);
      __publicField(this, "WhileApiHolds", async (iframe, delay = 500) => {
        while (isRendered$1(iframe) && isNaN(this.t?.getCurrentTime?.())) {
          await sleep(delay);
        }
      });
      __publicField(this, "loadVideoById", (o) => this.t.loadVideoById(o));
      __publicField(this, "getDuration", () => this.t.getDuration());
      __publicField(this, "setVolume", (n) => this.t.setVolume(n));
      __publicField(this, "getVolume", () => this.t.getVolume());
      __publicField(this, "seekTo", (n) => this.t.seekTo(n));
      __publicField(this, "getCurrentTime", () => this.t.getCurrentTime());
      __publicField(this, "getPlayerState", () => this.t.getPlayerState());
      __publicField(this, "setPlaybackRate", (n) => this.t.setPlaybackRate(n));
      __publicField(this, "getPlaybackRate", () => this.t.getPlaybackRate());
      __publicField(this, "setPlayerState", (s) => this.t.playerInfo.playerState = s);
      __publicField(this, "playVideo", () => this.t.playVideo());
      __publicField(this, "pauseVideo", () => this.t.pauseVideo());
      __publicField(this, "unMute", () => this.t.unMute());
      __publicField(this, "mute", () => this.t.mute());
      __publicField(this, "getIframe", () => this.t.getIframe());
      __publicField(this, "destroy", () => this.t.destroy());
      __publicField(this, "getAvailablePlaybackRates", () => this.t.getAvailablePlaybackRates());
      this.t = target;
      target.ytgif ?? (target.ytgif = new m());
      this.ytgif = target.ytgif;
    }
    DestroyTarget() {
      if (!this.t)
        return;
      this.ytgif.enter = () => {
      };
      this.t.destroy();
    }
    setOnStateChange(cb) {
      this.t.m.i[5] = cb;
    }
  }
  class m {
    constructor() {
      __publicField(this, "previousTick", 0);
      __publicField(this, "timers", Array());
      __publicField(this, "timerID", 0);
      __publicField(this, "globalHumanInteraction", false);
    }
    ClearTimers() {
      window.clearInterval(this.timerID);
      this.timerID = 0;
      if (this.timers.length != 0) {
        for (const tmr of this.timers) {
          clearInterval(tmr);
        }
        this.timers = [];
      }
    }
    PushSingleInterval(cb, delay = 1e3) {
      this.ClearTimers();
      this.timerID = window.setInterval(cb, delay);
      this.timers.push(this.timerID);
    }
    enter() {
    }
  }
  const recordedIDs = /* @__PURE__ */ new Map();
  const allVideoParameters = /* @__PURE__ */ new Map();
  const lastBlockIDParameters = /* @__PURE__ */ new Map();
  const observedParameters = /* @__PURE__ */ new Map();
  const anchorInstanceMap = /* @__PURE__ */ new Map();
  const UIDtoURLInstancesMapMap = /* @__PURE__ */ new Map();
  const YTvideoIDs = /* @__PURE__ */ new Map();
  const s_u_f_key = "simulate_url_formatter";
  class StartEnd_Config {
  }
  __publicField(StartEnd_Config, "componentPage", "yt-gif\\/(start|end)");
  __publicField(StartEnd_Config, "targetStringRgx", /(\d+h)(\d+m)|(\d+h)?(\d+m)?(\d+s)|(\d+m)|(\d+h)|((\d{1,2}):)?((\d{1,2}):)((\d{1,2}))|(\d+(?:(\.\d{1})|(?=\s|\}|\w+|$)))/);
  class YTGIF_Config {
  }
  __publicField(YTGIF_Config, "componentPage", "yt-gif|video");
  __publicField(YTGIF_Config, "targetStringRgx", /https\:\/\/(www\.)?(youtu(be.com\/watch|.be\/))?(.*?(?=\s|$|\}|\]|\)))/);
  __publicField(YTGIF_Config, "minimalRgx", /(?<!\S)\/[^:|\s|}|\]|\)]{11,}/);
  __publicField(YTGIF_Config, "guardClause", (url2) => typeof url2 == "string" && !!url2.match("https://(www.)?youtube|youtu.be"));
  class URL_Config {
  }
  __publicField(URL_Config, "componentPage", Wild_Config.componentPage);
  __publicField(URL_Config, "scatteredMatch", true);
  __publicField(URL_Config, "targetStringRgx", YTGIF_Config.targetStringRgx);
  const anchorsRgx = BlockRegexObj("yt-gif/anchor|yt-gif");
  class Anchor_Config {
  }
  __publicField(Anchor_Config, "componentPage", "yt-gif/anchor|yt-gif");
  __publicField(Anchor_Config, "componentRgx", anchorsRgx.componentRgx);
  __publicField(Anchor_Config, "uidRefRgx", new RegExp(
    `\\(\\(${anchorsRgx.anyUidRgx.source}\\)\\)`,
    "gm"
  ));
  __publicField(Anchor_Config, "targetStringRgx", new RegExp(
    `${YTGIF_Config.targetStringRgx.source}|${anchorsRgx.anyUidRgx.source}`,
    "gm"
  ));
  const videoParams = new TVideoParams();
  const sessionIDs = new T_YT_RECORD();
  async function Mutation_cb_raw_rm_cmpts(mutationsList, targetClass, onRenderedCmpt_cb2) {
    const found = [];
    for (const { addedNodes } of mutationsList) {
      for (const node of Array.from(addedNodes)) {
        if (!node.tagName)
          continue;
        if (node.classList.contains(targetClass))
          found.push(node);
        else if (node.firstElementChild)
          found.push(...node.getElementsByClassName(targetClass));
      }
    }
    for (const node of found)
      if (isNotZoomPath(node))
        onRenderedCmpt_cb2(node);
  }
  function closestBlock(el) {
    return el ? el.closest(".rm-block__input") : null;
  }
  function isRendered(el) {
    return document.body.contains(el);
  }
  function getUidFromBlock(el, closest = false) {
    let block = el;
    if (closest)
      block = closestBlock(el);
    return block?.id?.slice(-9);
  }
  function closest_container_request(el) {
    if (isSelected(UI$1.timestamps.tm_options, "anchor"))
      return closest_anchor_container(el);
    else
      return closest_container(el);
  }
  function closest_anchor_container(el) {
    const anc = (el2) => el2?.closest("[yt-gif-anchor-container]") ?? null;
    const yuid = (el2) => el2?.getAttribute("yt-gif-anchor-container");
    const buid = (el2) => el2?.getAttribute("yt-gif-block-uid");
    const rm = closest_container(el);
    const yt = anc(el);
    if (buid(rm) == yuid(anc(rm)))
      return anc(rm);
    return rm || yt;
  }
  function closest_container(el) {
    return el?.closest(".roam-block-container") ?? null;
  }
  function closestYTGIFparentID(el) {
    return (closestBlock(el) || el?.closest(".dwn-yt-gif-player-container"))?.id;
  }
  function getWrapperUrlSufix(wrapper, uid = "") {
    const url2 = wrapper?.getAttribute(attrInfo.url.path);
    const urlIndex = wrapper?.getAttribute(attrInfo.url.index);
    const urlSufix = properBlockIDSufix(url2, urlIndex);
    return uid + urlSufix;
  }
  function closest_attr(el, attr) {
    const found = el?.closest(`[${attr}]`);
    return { found, value: found?.getAttribute(attr) };
  }
  function ElementsPerBlock(block, selector) {
    if (!block)
      return [];
    return block.queryAllasArr(selector).filter((b) => closestBlock(b)?.id == block.id);
  }
  const aliasSel = {
    inline: {
      is: "a.rm-alias.rm-alias--block",
      from: ".rm-alias-tooltip__content"
    },
    card: {
      is: ".rm-block__part--equals",
      from: ".bp3-card"
    }
  };
  const openAlias = function(isSel) {
    return document.querySelector(`.bp3-popover-open > ${isSel}`);
  };
  const aliasCondition = function(originalEl) {
    return function condition2() {
      const PopOverParent = originalEl.closest(`div.bp3-popover-content > ${this.from}`);
      return PopOverParent && this.uidCondition();
    };
  };
  const grandParentBlockFromAlias = function() {
    return closestBlock(this.el.closest(".bp3-popover-open"));
  };
  const grandParentBlock = function() {
    return closestBlock(this.el);
  };
  const condition = function() {
    return this.uid = getUidFromBlock(this.grandParentBlock());
  };
  const SubUrlObj = {
    urlComponents: function() {
      return [
        ...Array.from(
          this.grandParentBlock().querySelectorAll(this.targetSelector)
        )
      ];
    },
    getUrlIndex: function() {
      return this.urlComponents().indexOf(this.el);
    }
  };
  function GetUidResultObj(el) {
    const uidResults = {
      "is component": GetIsComponent(el),
      "is tooltip card": GetIsTooltipCard(el),
      "is alias": GetIsAlias(el),
      "is ddm tutorial": GetIsDmmTutorial(el)
    };
    Object.values(uidResults).forEach((obj) => Object.assign(obj, SubUrlObj));
    Object.assign(uidResults["is component"], {
      urlComponents: function() {
        return ElementsPerBlock(this.grandParentBlock(), this.targetSelector);
      }
    });
    return {
      key: ObjectKeys(uidResults).find((x) => uidResults[x].condition()),
      uidResults
    };
  }
  function GetPreSelector() {
    return [
      [...window.AvoidCircularDependency.getCurrentClassesToObserver()].map(
        (s) => "." + s
      ),
      ".yt-gif-wrapper"
    ];
  }
  function GetIsDmmTutorial(el) {
    return {
      uid: "irrelevant-uid",
      url: "",
      el,
      targetSelector: ["[data-video-url]"].join(),
      condition: function() {
        return this.url = this.el.getAttribute(attrInfo.url.path) || "";
      },
      grandParentBlock: function() {
        return this.el.closest(".dropdown-content");
      }
    };
  }
  function GetIsAlias(el) {
    return {
      uid: "",
      url: "",
      el: openAlias(aliasSel.inline.is),
      targetSelector: [aliasSel.inline.is].join(),
      from: aliasSel.inline.from,
      grandParentBlock: grandParentBlockFromAlias,
      uidCondition: condition,
      condition: aliasCondition(el)
    };
  }
  function GetIsTooltipCard(el) {
    return {
      uid: "",
      url: "",
      el: openAlias(aliasSel.card.is),
      targetSelector: [aliasSel.card.is].join(),
      from: aliasSel.card.from,
      grandParentBlock: grandParentBlockFromAlias,
      uidCondition: condition,
      condition: aliasCondition(el)
    };
  }
  function GetIsComponent(el) {
    return {
      uid: "",
      url: "",
      targetSelector: GetPreSelector().join(),
      el,
      condition,
      grandParentBlock,
      ...SubUrlObj
    };
  }
  async function getAnchor_smart(uid) {
    return getMap_smart(
      uid,
      anchorInstanceMap,
      getComponentMap,
      uid,
      Anchor_Config
    );
  }
  async function getUrlMap_smart(uid) {
    return getMap_smart(
      uid,
      UIDtoURLInstancesMapMap,
      getComponentMap,
      uid,
      YTGIF_Config
    );
  }
  async function getMap_smart(key, map, callback, ...setMapCb_params) {
    if (!key)
      throw new Error("invalid uid|key while trying to call getComponentMap");
    if (!map.has(key))
      map.set(key, await callback(...setMapCb_params));
    return map.get(key);
  }
  async function getComponentMap(tempUID, _Config) {
    let uidMagazine = Array();
    let indentFunc = 0;
    const { componentPage, targetStringRgx, scatteredMatch } = _Config;
    class TOrder {
      constructor() {
        __publicField(this, "order", -1);
        __publicField(this, "incrementIf", (condition2) => {
          return condition2 ? Number(++this.order) : null;
        });
        __publicField(this, "condition", (x) => false);
      }
    }
    class IResults {
      constructor() {
        __publicField(this, "is tooltip card", new TOrder());
        __publicField(this, "is substring", new TOrder());
        __publicField(this, "is component", new TOrder());
        __publicField(this, "is alias", new TOrder());
        __publicField(this, "is block reference", new TOrder());
      }
    }
    class IStringWithUIDs {
      constructor() {
        __publicField(this, "targetStringsWithUids", Array());
        __publicField(this, "blockReferencesAlone", Array());
        __publicField(this, "uid", "");
        __publicField(this, "uidHierarchy", Array());
        __publicField(this, "isKey");
      }
    }
    const results = new IResults();
    return TryToFindTargetStrings_Rec(
      await TryToFindTargetString(tempUID),
      new IStringWithUIDs(),
      /* @__PURE__ */ new Map()
    );
    async function TryToFindTargetStrings_Rec(objRes, parentObj, map) {
      for (const matchObj of objRes?.targetStringsWithUids) {
        const { value, is } = matchObj;
        const generateUniqueKey = () => assertUniqueKey_while(
          objRes.uid,
          indentFunc,
          matchObj
        );
        if (["is alias", "is component", "is substring"].some((w) => w === is)) {
          map.set(generateUniqueKey(), value);
        } else if (is === "is tooltip card") {
          const { tooltipKey, tooltipObj } = generateTooltipObj(
            value,
            objRes,
            generateUniqueKey
          );
          const tooltipMap = await TryToFindTargetStrings_Rec(
            tooltipObj,
            parentObj,
            /* @__PURE__ */ new Map()
          );
          map.set(tooltipKey, tooltipMap);
        } else if (is == "is block reference") {
          parentObj.uidHierarchy = pushSame(parentObj.uidHierarchy, value);
          const comesFromRecursiveParent = parentObj?.uid == value;
          const isSelfRecursive = parentObj?.blockReferencesAlone?.includes(value) || value == tempUID;
          const pastFirstLevel = indentFunc > parentObj?.uidHierarchy?.length;
          if (comesFromRecursiveParent || pastFirstLevel && isSelfRecursive)
            continue;
          indentFunc += 1;
          objRes.isKey = is;
          map = await TryToFindTargetStrings_Rec(
            await TryToFindTargetString(value),
            objRes,
            map
          );
          indentFunc -= 1;
        }
      }
      return map;
      function assertUniqueKey_while(uid, indent, { is, order, capture }) {
        uidMagazine = PushIfNewEntry(uidMagazine, uid);
        const similarCount = uidMagazine.filter((x) => x === uid).length;
        return {
          indent,
          uid,
          similarCount,
          isKey: is,
          isKeyOrder: isCount(),
          order,
          capture
        };
        function isCount() {
          for (const [_is, _val] of Object.entries(results))
            _val.incrementIf(_is === is);
          return results[is].order;
        }
      }
      function PushIfNewEntry(arr, item) {
        const lastItem = [...arr]?.pop();
        if (lastItem != item)
          arr = pushSame(arr, item);
        return arr;
      }
    }
    function generateTooltipObj(value, objRes, generateUniqueKey) {
      const tooltipObj = stringsWihtUidsObj(value);
      tooltipObj.uid = objRes.uid + "_t" + (results["is tooltip card"].order < 0 ? 0 : results["is tooltip card"].order);
      const tooltipKey = generateUniqueKey();
      return { tooltipKey, tooltipObj };
    }
    async function TryToFindTargetString(desiredUID) {
      const rawText = await getBlockStringByUID(desiredUID);
      const resObj = stringsWihtUidsObj(rawText);
      resObj.uid = desiredUID;
      resObj.uidHierarchy = resObj.uidHierarchy ?? [];
      return resObj;
    }
    function stringsWihtUidsObj(rawText) {
      const { blockRgx, aliasPlusUidsRgx, tooltipCardRgx, componentRgx } = BlockRegexObj(componentPage, targetStringRgx);
      const string = clean_rm_string(rawText);
      let blockRefsOnly = [];
      const compactObjs = getRenderedStuff(string);
      const targetStringsWithUids = compactObjs.flat(Infinity).filter((x) => x != null);
      return {
        ...{},
        targetStringsWithUids,
        blockReferencesAlone: blockRefsOnly
      };
      function getRenderedStuff(string2) {
        const blockMatches = [
          ...[...string2.matchAll(new RegExp(blockRgx, "gm"))].map(
            (x) => x = x[0]
          )
        ];
        const siblingsOrderObj = new IResults();
        return blockMatches.map((val) => isValueObj(val, siblingsOrderObj));
        function isValueObj(val, siblingsOrder) {
          function resObj() {
            siblingsOrder[is].incrementIf(true);
            return {
              value: inOrderValue,
              is,
              order: siblingsOrder[is].order,
              capture: rgxMatch
            };
          }
          const match = (rgx) => val.match(rgx)?.[0];
          const matchAll = (rgx) => [...val.matchAll(rgx)][0];
          let is = "is block reference", inOrderValue = val, rgxMatch;
          if (rgxMatch = match(tooltipCardRgx)) {
            is = "is tooltip card";
            inOrderValue = matchAll(tooltipCardRgx)[2];
            const blockLikeString = matchAll(tooltipCardRgx)[1];
            return [resObj(), ...getRenderedStuff(blockLikeString)];
          } else if (rgxMatch = match(aliasPlusUidsRgx)) {
            is = "is alias";
            inOrderValue = matchAll(aliasPlusUidsRgx)[2];
          } else if (scatteredMatch && (rgxMatch = match(targetStringRgx)) && !match(componentRgx)) {
            is = "is substring";
            inOrderValue = match(targetStringRgx);
          } else if (!scatteredMatch && (rgxMatch = match(componentRgx))) {
            is = "is component";
            inOrderValue = match(targetStringRgx);
          } else {
            if (inOrderValue.length != 9)
              return null;
            else
              blockRefsOnly = pushSame(blockRefsOnly, val);
          }
          return resObj();
        }
      }
    }
  }
  function clean_rm_string(rawText) {
    const s1 = rawText.replace(
      /(`.+?`)|(`([\s\S]*?)`)/gm,
      "used_to_be_an_inline_code_block"
    );
    return s1.replace(
      new RegExp(preRgxComp("embed"), "gm"),
      "used_to_be_an_embed_block"
    );
  }
  function Value_AtIndexInMap(map, valueAtIndex, property) {
    const key = FilterMapByIsKey(map, property)?.[valueAtIndex];
    return map?.get(key);
  }
  function ObjKey_AtIndexInMap(map, valueAtIndex, property) {
    return FilterMapByIsKey(map, property)?.[valueAtIndex];
  }
  function FilterMapByIsKey(map, property) {
    if (!map || map?.size == 0)
      return null;
    return [...map.keys()].filter((o) => o["isKey"].includes(property));
  }
  async function Flow(uidResults, key) {
    const resObj = {
      uid: uidResults[key].uid,
      preUrlIndex: uidResults[key].getUrlIndex(),
      accUrlIndex: 0,
      url: uidResults[key].url,
      grandParentBlock: uidResults[key].grandParentBlock(),
      nestedComponentMap: {},
      earlyReturnKey: ""
    };
    if (key == "is ddm tutorial") {
      resObj.accUrlIndex = resObj.preUrlIndex;
      return resObj;
    } else if (key == "is tooltip card") {
      const tempMap = await getUrlMap_smart(uidResults[key].uid);
      resObj.nestedComponentMap = Value_AtIndexInMap(
        tempMap,
        resObj.preUrlIndex,
        key
      );
      if (!resObj?.nestedComponentMap || resObj?.nestedComponentMap.size == 0) {
        console.log("yt-gif debugger");
        resObj.nestedComponentMap = [...tempMap.values()][resObj.preUrlIndex];
      }
      if (!resObj?.nestedComponentMap || resObj?.nestedComponentMap.size == 0) {
        return resObj;
      }
      updateUrlIndexInsideAlias();
    } else if (key == "is alias") {
      const tempMap = await getUrlMap_smart(uidResults[key].uid);
      resObj.uid = Value_AtIndexInMap(tempMap, resObj.preUrlIndex, key);
      resObj.nestedComponentMap = await getUrlMap_smart(resObj.uid);
      updateUrlIndexInsideAlias();
    } else {
      resObj.nestedComponentMap = await getUrlMap_smart(resObj.uid);
    }
    resObj.url = Value_AtIndexInMap(
      resObj.nestedComponentMap,
      resObj.preUrlIndex,
      "is component"
    );
    resObj.accUrlIndex += resObj.preUrlIndex;
    return resObj;
    function updateUrlIndexInsideAlias() {
      resObj.accUrlIndex += resObj.preUrlIndex;
      resObj.preUrlIndex = uidResults[key].getUrlIndex();
    }
  }
  async function URLResults(el) {
    const { key, uidResults } = GetUidResultObj(el);
    if (!key) {
      return {};
    }
    const resObj = await Flow(uidResults, key);
    if (!YTGIF_Config.guardClause(resObj?.url)) {
      resObj.url = "";
    }
    return resObj;
  }
  function GetConfirmBtns(btnNames2, urlBtn) {
    return () => btnNames2.map((s) => urlBtn(s)).forEach((btn) => {
      const p = btn?.closest(".btn-row") || btn?.closest(".yt-gif-url-btn-wrapper");
      if (p && !btn.onclick)
        p.style.display = "none";
    });
  }
  function GetUrlBtn(el, sel2) {
    return (page) => el.querySelector(`${sel2} [yt-gif-url-btn="${page}"]`);
  }
  function appendVerticalUrlBtns(targetNode, kind = "formatter") {
    const urlBtns = appendlUrlBtns(targetNode, kind);
    toggleClasses(true, ["vertical"], urlBtns);
  }
  function appendlUrlBtns(targetNode, kind = "formatter") {
    const c = "yt-gif-url-btns-wrapper";
    const el = targetNode.querySelector(`[${kind}]`) ?? div([c]);
    const dir = kind == "formatter" ? "urlBtn" : "insertOptions";
    if (!el.querySelector(".yt-gif-url-btns"))
      el.insertAdjacentHTML("afterbegin", links.html.fetched[dir]);
    if (!isRendered(el))
      targetNode.insertAdjacentElement("afterbegin", el);
    toggleClasses(true, [c], el);
    return targetNode.querySelector(".yt-gif-url-btns");
  }
  function Format$1() {
    let url2 = "", hidden = "";
    return {
      getters: {
        get u() {
          return url2;
        },
        get h() {
          return hidden;
        }
      },
      trim(res) {
        url2 = res.url;
        hidden = res.hidden ?? "";
        hidden = hidden.trim() ? hidden.trim() + " " : "";
      }
    };
  }
  const btnNames$1 = ["speed", "start", "end"];
  function fmtTimestamp(value = UI$1.timestamps.tm_workflow_display.value) {
    const str2sec = (str2) => HMSToSecondsOnly(str2.toString());
    let fmt = (tms) => tms.toString();
    if (value == "lessHMS")
      fmt = (tms) => seconds2time(str2sec(tms.toString()));
    else if (value == "HMS")
      fmt = (tms) => convertHMS(str2sec(tms.toString()));
    else if (value == "hmsSufix")
      fmt = (tms) => seconds2time(str2sec(tms.toString()), true);
    else if (value == "S" || {}.toString() == "number")
      fmt = (tms) => str2sec(tms.toString());
    return fmt;
  }
  function replaceString({ string, start, end, replace }) {
    if (start < 0 || start > string.length) {
      throw new RangeError(
        `start index ${start} is out of the range 0~${string.length}`
      );
    }
    if (end > string.length || end < start) {
      throw new RangeError(
        `end index ${end} is out of the range ${start}~${string.length}`
      );
    }
    return string.substring(0, start) + replace + string.substring(end);
  }
  function delSubstr(str2, st, ed) {
    return str2.substring(0, st) + str2.substring(ed);
  }
  function NonReferencedPerBlock(block, selector, targetNode) {
    const inBlockEls = ElementsPerBlock(block, selector);
    const closestRef = (el) => el.closest(".rm-block-ref[data-uid]");
    const refParent = closestRef(targetNode);
    const innerElms = ChildrenPerEml(selector, refParent);
    const elemtToFilter = innerElms.length != 0 ? innerElms : inBlockEls;
    const condition2 = (b) => refParent ? closestRef(b) : !closestRef(b);
    return elemtToFilter.filter(condition2);
    function ChildrenPerEml(selector2, parent) {
      if (!parent)
        return [];
      return parent.queryAllasArr(selector2).filter((b) => b.closest(selector2) == parent);
    }
  }
  function isSpace(s) {
    return /\s/g.test(s);
  }
  function getConcatS(string) {
    return isSpace([...string].pop()) ? "" : " ";
  }
  function rgx2Gm(rgx) {
    return new RegExp(rgx.source, "gm");
  }
  function stopEvents(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  function tryFmt_urlParam({
    match,
    value,
    p,
    float,
    fmt = "S"
  }) {
    let m2 = match, v = value;
    v = !float ? fmtTimestamp(fmt)(v ?? "0") : Number(v);
    if (!v || v == "0" || v == "0s")
      return m2;
    const replace = new RegExp(`(${paramRgx(p).source})`);
    if (replace.test(m2)) {
      return m2.replace(replace, `${p}=${v}`);
    } else {
      const c = [...m2].pop() == "?" ? "" : m2.includes("?") ? "&" : "?";
      return m2 += `${c}${p}=${v}`;
    }
  }
  function assertTmParams(url2, fmt_) {
    const fmt = (p, v) => tryFmt_urlParam({
      match: url2,
      value: v,
      p,
      float: false,
      fmt: fmt_ ?? UI.timestamps.tm_workflow_grab.value
    });
    url2 = fmt("t", floatParam("t", url2));
    url2 = fmt("end", floatParam("end", url2));
    return url2;
  }
  function getAnyTmParamType(url2) {
    return getTypeOfTmParam("t", url2) || getTypeOfTmParam("end", url2);
  }
  function validTmParam(url2) {
    return floatParam("t", url2) ?? floatParam("end", url2);
  }
  function getTypeOfTmParam(p, url2) {
    const str2 = paramRgx(p)?.exec(url2)?.[2];
    if (/:/.test(str2))
      return "HMS";
    if (/h|m|s/.test(str2))
      return "hmsSufix";
    if (/\d+/.test(str2))
      return "S";
  }
  async function CreateXload(src) {
    const obj = {
      src,
      id: `script-yt_gif-${src}`
    };
    romoveIfany(obj.id);
    const script = createScript(obj);
    return await loadScript(script);
    function romoveIfany(id) {
      document.queryAllasArr(`[id='${id}']`).forEach((script2) => script2.parentElement.removeChild(script2));
    }
    function createScript({ src: src2, id } = obj) {
      const script2 = document.createElement("script");
      script2.src = src2 + "?" + new Date().getTime();
      script2.id = id;
      script2.async = false;
      script2.type = "text/javascript";
      document.getElementsByTagName("head")[0].appendChild(script2);
      return script2;
    }
    async function loadScript(script2) {
      return new Promise((resolve) => {
        script2.addEventListener("load", () => resolve(script2));
      });
    }
  }
  function GetParamFunc(key, media, tm) {
    const alias = [key, ...media[key].alias];
    const init2 = media[key].value;
    return alias.reduce((acc, crr) => {
      const val = tm(crr) ?? init2;
      return val ? val : acc;
    }, init2);
  }
  function indexPairObj(regex, str2, type) {
    const matches = [...str2.matchAll(regex)];
    const indexPairs = [];
    for (const matchArr of matches) {
      const idx = matchArr.index ?? 0;
      indexPairs.push({
        type,
        start: idx,
        end: idx + matchArr[0].length,
        match: matchArr[0],
        groups: matchArr
      });
    }
    return indexPairs;
  }
  class TIndexPair {
    constructor() {
      __publicField(this, "type", "");
      __publicField(this, "start", 0);
      __publicField(this, "end", 0);
      __publicField(this, "match");
      __publicField(this, "groups", []);
    }
  }
  function ExtractContentFromCmpt(capture) {
    return [...capture.matchAll(BlockRegexObj().componentRgx)][0]?.[5] || capture;
  }
  function ExtractUrlsObj(searchThrough) {
    const { targetStringRgx: urlRgx, minimalRgx } = YTGIF_Config;
    if (!searchThrough)
      return new TIndexPair();
    return indexPairObj(rgx2Gm(urlRgx), searchThrough, "url")?.[0] || indexPairObj(rgx2Gm(minimalRgx), searchThrough, "minimal")?.[0] || new TIndexPair();
  }
  function ExtractParamsFromUrl(url2) {
    const media = new IExtendedVideoParams();
    const matches = {};
    if (YTGIF_Config.guardClause(url2)) {
      for (const pair of [...url2.matchAll(/(\w+)=([^&]+)/gm)]) {
        matches[pair[1]] = pair[2];
      }
      media.id.set(getYouTubeVideoID(url2));
      media.src.set(url2);
      media.start.setDefault(GetStartEndParam("start"));
      media.end.setDefault(GetStartEndParam("end"));
      media.volume.set(GetNumParam("volume"));
      media.speed.setDefault(GetNumParam("speed"));
      media.hl.set(GetStrParam("hl"));
      media.cc.set(GetStrParam("cc"));
      media.sp.set(GetStrParam("sp"));
      return media;
    }
    return {};
    function GetStartEndParam(key) {
      return GetParamFunc(key, media, (str2) => time2sec(matches[str2]));
    }
    function GetNumParam(key) {
      return GetParamFunc(key, media, (str2) => parseFloat(matches[str2]));
    }
    function GetStrParam(key) {
      return GetParamFunc(key, media, (str2) => matches[str2]);
    }
  }
  function UrlBtnAction2InfoObj(capture, ExtractSubstringObj = ExtractUrlsObj) {
    const content = ExtractContentFromCmpt(capture);
    const matchObj = ExtractSubstringObj(content);
    const start = matchObj?.start;
    const end = matchObj?.end;
    let hidden = matchObj?.match ? delSubstr(content, start, end) : "";
    if (hidden && matchObj?.match) {
      if (isSpace(hidden[start - 1]) && isSpace(hidden[start]))
        hidden = delSubstr(hidden, start - 1, start);
    }
    hidden = hidden.trim();
    return {
      hiddenObj: ExtractSubstringObj(hidden),
      matchObj,
      contentObj: {
        match: matchObj?.match,
        hidden,
        content
      }
    };
  }
  async function FilterToUrl(o) {
    const actionObj = UrlBtnAction2InfoObj(o.capture, ExtractUrlsObj);
    let match = actionObj.matchObj.match;
    let fmt = getAnyTmParamType(match);
    fmt = fmt == "S" ? "hmsSufix" : "S";
    actionObj.matchObj.match = assertTmParams(match, fmt);
    return getResults(actionObj);
  }
  async function ExamineResObj$1(resObj) {
    const actionObj = UrlBtnAction2InfoObj(resObj.capture, ExtractUrlsObj);
    actionObj.matchObj.match = tryFmt_urlParam({
      match: actionObj.matchObj.match,
      value: resObj.from.value ?? paramRgx(resObj.from.param)?.exec(
        actionObj.matchObj.match
      )?.[2],
      p: resObj.from.param,
      fmt: UI$1.timestamps.tm_workflow_grab.value,
      float: resObj.from.float ?? false
    });
    return getResults(actionObj);
  }
  function getResults(actionObj) {
    return {
      url: actionObj.matchObj.match,
      hidden: actionObj.contentObj.hidden
    };
  }
  function fmtIframe2Url(targetNode, innerWrapperSel = ".yt-gif-url-btns") {
    const urlBtn = GetUrlBtn(targetNode, innerWrapperSel);
    const { getters: _, trim } = Format$1();
    return {
      urlBtn,
      confirmBtns: GetConfirmBtns(btnNames$1, urlBtn),
      instParam: async (o) => {
        await ExamineResObj$1(o).then(trim);
        return `{{[[yt-gif]]: ${_.u} ${_.h}}}`;
      },
      updUrl: async (o) => {
        o.to = ["url"];
        await FilterToUrl(o).then(trim);
        return `${_.u}${_.h}`;
      }
    };
  }
  function StopPropagations(urlBtn, targetNode, innerWrapperSel = ".yt-gif-url-btns") {
    const innerWrapper = targetNode.querySelector(innerWrapperSel);
    if (innerWrapper) {
      innerWrapper.onmousedown = stopEvents;
    }
    btnNames.map((s) => urlBtn(s)).forEach((btn) => btn.onmousedown = stopEvents);
  }
  const btnNames = [
    "yt-gif",
    "format",
    "url",
    "start",
    "end",
    "start|end"
  ];
  function getFmtPage(p, url2) {
    return fmtTimestamp(UI$1.timestamps.tm_workflow_grab.value)(
      floatParam(p, url2) || "0"
    );
  }
  function startTm(url2) {
    return getFmtPage("t|start", url2);
  }
  function endTm(url2) {
    return getFmtPage("end", url2);
  }
  function Format() {
    let url2 = "", hidden = "";
    return {
      getters: {
        get u() {
          return url2;
        },
        get h() {
          return hidden;
        }
      },
      concatNoCmpt(res) {
        hidden = hidden.trim();
        const cs = !hidden ? "" : " ";
        const ce = isSpace(res.space) ? "" : cs;
        hidden = cs + hidden + ce;
      },
      trim(res) {
        url2 = res.url;
        hidden = res.hidden ?? "";
        hidden = hidden.trim() ? hidden.trim() + " " : "";
        return res;
      }
    };
  }
  async function TryRecycle(recycledRequest, tempUid) {
    const blockReq = recycledRequest ?? await getBlockInfoByUIDM(tempUid);
    const info = blockReq?.[0]?.[0];
    return { info, blockReq };
  }
  function filterOutCode(indexObj) {
    const inlindeCodeRgx = /(`.+?`)|(`([\s\S]*?)`)/gm;
    return [...indexObj].filter((x) => !inlindeCodeRgx.test(x.match));
  }
  function GetPossibleMatches(IndexObj, toReplace) {
    return IndexObj(
      new RegExp(`(${toReplace.replace(/(?=[.\\+*?[^\]$(){}\|])/g, "\\")})`, "gm"),
      "urlsMatch"
    );
  }
  function GetBadMatches(IndexObj, toReplace) {
    const BadIndexMatches = [
      ...IndexObj(/(`.+?`)|(`([\s\S]*?)`)/gm, "codeBlocks"),
      ...filterOutCode(IndexObj(/{{=:(.+?)\|(.+)}}/gm, "tooltipPrompt")).map(
        promptToBadCode
      )
    ];
    const cmptRgx = Wild_Config.targetStringRgx;
    if (!toReplace.match(cmptRgx)?.[0]) {
      BadIndexMatches.push(...IndexObj(cmptRgx, "components"));
    }
    return BadIndexMatches;
  }
  function TryGetStartEnd(validSubstrings, replaceIndex) {
    let start, end;
    try {
      if (validSubstrings.length == 1 && !validSubstrings[replaceIndex]) {
        replaceIndex = 0;
      }
      start = validSubstrings[replaceIndex].start;
      end = validSubstrings[replaceIndex].end;
    } catch (error) {
      console.log("yt-gif debugger");
      throw new Error(
        `YT GIF Formatter: Crashed because of out of bounds target...`
      );
    }
    return { start, end, replaceIndex };
  }
  function rightMatch(BadIndexMatches, good) {
    let specialCase = false;
    const badIndex = BadIndexMatches.some((bad) => {
      const bounded = good.start >= bad.start && good.end <= bad.end;
      specialCase = bad.type == "tooltipPrompt";
      return bounded;
    });
    if (specialCase)
      return true;
    return !badIndex;
  }
  function promptToBadCode(op) {
    const y = { ...op };
    y.start = op.start + 4;
    y.end = op.end - (1 + op.groups[2]?.length + 2);
    y.match = op.groups[1];
    return y;
  }
  async function TryToUpdateBlockSubString(tempUid, replaceIndex, toReplace, recycledRequest) {
    const { info, blockReq } = await TryRecycle(recycledRequest, tempUid);
    if (!info || replaceIndex == -1) {
      return { ...{}, success: false, open: false };
    }
    const index = (rgx, type) => indexPairObj(rgx, info.string, type);
    const bad = GetBadMatches(index, toReplace);
    const possible = GetPossibleMatches(index, toReplace);
    const valid = possible.filter((good) => rightMatch(bad, good));
    const res = {
      success: true,
      uid: tempUid,
      ...TryGetStartEnd(valid, replaceIndex),
      open: info.open,
      string: info.string,
      recycledRequest: blockReq
    };
    return res;
  }
  const strCheck = {
    default: "",
    ok: (str2) => str2?.length > 0
  };
  const boundCheck = {
    default: 0,
    ok: (v) => v > 0
  };
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const toUrlKeys = {
    speed: {
      default: 1,
      ok: function(x) {
        return GetClosestRate(playbackRates, x) != this.default;
      }
    },
    start: boundCheck,
    end: boundCheck,
    volume: {
      default: 40,
      ok: function(v) {
        return v != this.default && v >= 0;
      }
    },
    hl: strCheck,
    cc: strCheck,
    sp: strCheck
  };
  function tryFmt_timestamp({ page, value, match }) {
    const p = page == "end" ? "end" : "t";
    const fmt = UI$1.timestamps.tm_workflow_grab.value != "S" ? "hmsSufix" : "S";
    return tryFmt_urlParam({ match, value, p, fmt, float: false });
  }
  function fmtUrlsObj(duplicateParams, urlObj) {
    let params_ = ObjectKeys(toUrlKeys).filter(
      (k) => !duplicateParams.includes(k) && toUrlKeys[k].ok(urlObj[k].value)
    ).reduce((acc, crr) => {
      const min = urlObj[crr].alias[0] || crr;
      return acc + `&${min}=${urlObj[crr].value}`;
    }, "").slice(1);
    const fmt = UI$1.timestamps.tm_workflow_grab.value != "S" ? "hmsSufix" : "S";
    const params = assertTmParams(params_, fmt);
    const c = isSelected(UI$1.display.fmt_options, "avoid_redundancy") ? "/" : "https://youtu.be/";
    const base2 = (_) => _ + urlObj.id.value;
    return {
      minimal: `${base2("/")}?${params}`,
      full: `${base2("https://youtu.be/")}?${params}`,
      fmtUrl: params.slice(1) ? `${base2(c)}?${params}` : base2(c)
    };
  }
  function getPearTimestamp(from, pear = "self") {
    return {
      timestamp: from.tmSetObj?.[pear]?.timestamp,
      pear
    };
  }
  function TryToRemoveRedundantTmParam(contentObj, { timestamp, pear }) {
    if (!timestamp) {
      return contentObj.hidden;
    }
    const value = fmtTimestamp()(timestamp);
    const rawValue = fmtTimestamp()(
      contentObj.content?.match(StartEnd_Config.targetStringRgx)?.[0] ?? "-1"
    );
    if (rawValue === value && isSelected(UI$1.display.fmt_options, "avoid_redundancy")) {
      if (pear == "self")
        contentObj.content = contentObj.content.trim().replace(timestamp.toString(), "");
      return contentObj.hidden.replace(timestamp.toString(), "");
    }
    return contentObj.hidden;
  }
  async function RemovePearFromString(from, resObj) {
    if (!from.tmSetObj?.pear)
      return null;
    const {
      ObjAsKey,
      block,
      targetNode,
      timestamp: tm,
      page: p
    } = from.tmSetObj.pear;
    const selfIndex = NonReferencedPerBlock(
      block,
      from.sel(tm, p),
      targetNode
    ).indexOf(targetNode);
    const { uid, capture } = ObjAsKey ?? {};
    if (!uid || !capture || selfIndex == -1)
      throw new Error(`YT GIF URL Formatter: Missing pear uid or capture...`);
    const resPear = await TryToUpdateBlockSubString(
      uid,
      selfIndex,
      capture,
      resObj.recycledRequest
    );
    if (!resPear.success)
      throw new Error(`YT GIF URL Formatter: Failed to update pear...`);
    resObj.string = replaceString({ ...resPear, replace: "" });
    const selfBound = resObj.start + resObj.end;
    const pearBound = resPear.start + resPear.end;
    if (selfBound > pearBound) {
      if (isSpace(resObj.string[resPear.start]) && isSpace(resObj.string[resPear.end + 1]))
        resObj.string = replaceString(
          Object.assign({ ...resPear }, { end: resPear.start + 1 })
        );
      resObj.start -= capture.length;
      resObj.end -= capture.length;
    } else if (isSpace(resObj.string[resPear.start - 1]) && isSpace(resObj.string[resPear.start])) {
      resObj.string = delSubstr(
        resObj.string,
        resPear.start - 1,
        resPear.start
      );
    }
    return UrlBtnAction2InfoObj(capture, ExtractTmsObj_cb);
    function ExtractTmsObj_cb(string) {
      return indexPairObj(
        rgx2Gm(StartEnd_Config.targetStringRgx),
        string,
        "timestamp"
      )?.[0];
    }
  }
  async function tryFmt_timestamp_pear(match, fallbackMatch, from) {
    const value = match;
    if (!value)
      return fallbackMatch;
    const page = from.tmSetObj?.pear?.page;
    return tryFmt_timestamp({
      page,
      value,
      match: fallbackMatch
    });
  }
  function TryToAppendHiddenPearContent(pearCaptureObj, contentObj) {
    const h = pearCaptureObj?.contentObj?.hidden;
    if (!h)
      return "";
    contentObj.content ?? (contentObj.content = "");
    const c = getConcatS(contentObj.content);
    return c + pearCaptureObj.contentObj?.content?.trim() + " ";
  }
  class TIframeMap {
    constructor() {
      __publicField(this, "blockID");
      __publicField(this, "start", 0);
      __publicField(this, "end", 0);
      __publicField(this, "HMS", 0);
      __publicField(this, "crrTime");
      __publicField(this, "condition", (sufix) => false);
    }
  }
  function getYTGIFparams(blockObj, lastUrlObj, filterUrlObj, originBlockObj) {
    const { match, index, componentMap } = lastUrlObj;
    const possibleIDsfx = blockObj.uid + properBlockIDSufix(match, index);
    const filter = ObjectValues(filterUrlObj).find(
      (x) => x.condition(possibleIDsfx)
    );
    const startObj = getBoundaryObj(floatParam("t|start", match).toString());
    const endObj = getBoundaryObj(floatParam("end", match).toString());
    return {
      formats: getBoundaryObj(filter?.crrTime?.toString() || ""),
      foundBlock: {
        ...blockObj,
        lastUrl: match,
        lastIndex: index,
        componentMap,
        blockID: filter?.blockID,
        possibleBlockIDSufix: possibleIDsfx
      },
      targetBlock: {
        ...originBlockObj,
        start: startObj,
        end: endObj
      },
      ok: true
    };
  }
  function AssembleFilterObjs() {
    const endsWith = (sfx, map) => [...map.keys()].find((k) => k?.endsWith(sfx));
    return {
      targets: {
        ...new TIframeMap(),
        condition: function(sfx) {
          const val = AssertValue(this, sfx, recordedIDs)?.wTarget?.getCurrentTime();
          return AssertCrrTime.call(this, val);
        }
      },
      lastParams: {
        ...new TIframeMap(),
        condition: function(sfx) {
          const val = AssertValue(this, sfx, lastBlockIDParameters)?.updateTime?.value;
          return AssertCrrTime.call(this, val);
        }
      }
    };
    function AssertValue(o, sfx, map) {
      o.blockID = endsWith(sfx, map);
      return map.get(o.blockID);
    }
    function AssertCrrTime(val) {
      this.crrTime = val ?? this.crrTime;
      return val ? true : false;
    }
  }
  function getBoundaryObj(v) {
    return {
      lessHMS: seconds2time(parseInt(v)),
      HMS: convertHMS(v),
      hmsSufix: seconds2time(parseInt(v), true),
      S: v
    };
  }
  async function getLastAnchorCmptInHierarchy(tempUID, includeOrigin = true) {
    const filterUrlObj = AssembleFilterObjs();
    const { blockStrings, originBlockObj } = await getParentsHierarchy(
      tempUID,
      includeOrigin
    );
    for (let blockObj of blockStrings?.reverse()) {
      const componentMap = await getMap_smart(
        blockObj.uid,
        anchorInstanceMap,
        getComponentMap,
        blockObj.uid,
        Anchor_Config
      );
      const reverseEntries = [...componentMap.entries()].reverse();
      const lastUrlObj = await findLastAnchorObj(reverseEntries, componentMap);
      if (!lastUrlObj || !lastUrlObj.match)
        continue;
      if (lastUrlObj.from == "yt-gif")
        blockObj = Object.assign(blockObj, lastUrlObj.ObjAsKey);
      return getYTGIFparams(
        blockObj,
        lastUrlObj,
        filterUrlObj,
        originBlockObj
      );
    }
    return { ok: false };
  }
  async function findLastAnchorObj(reverseEntries, map) {
    const resObj = (str2, entry) => ({
      match: str2,
      index: reverseEntries.indexOf(entry),
      componentMap: map,
      from: "anchor",
      ObjAsKey: {}
    });
    for (const entry of reverseEntries) {
      const [obj, str2] = entry;
      const match = obj?.capture ? [...obj?.capture.matchAll(Anchor_Config.componentRgx)][0] : [];
      const page = match?.[2];
      const content = match?.[5];
      if (page == "yt-gif" && YTGIF_Config.guardClause(str2))
        return resObj(str2, entry);
      if (page != "yt-gif/anchor" || !content)
        continue;
      if (YTGIF_Config.guardClause(str2))
        return resObj(str2, entry);
      if (!str2 || str2.length != 9)
        continue;
      return getLastUrlObjInMap(str2);
    }
    return null;
  }
  async function getLastUrlObjInMap(uid) {
    const componentMap = await getUrlMap_smart(uid);
    const reverseValues = [...componentMap.values()].reverse();
    const match = reverseValues.find((str2) => YTGIF_Config.guardClause(str2));
    const index = reverseValues.indexOf(match);
    return {
      match,
      index,
      componentMap,
      from: "yt-gif",
      ObjAsKey: [...componentMap.keys()].reverse()[index]
    };
  }
  async function getParentsHierarchy(tempUID, includeOrigin) {
    const ParentHierarchy = await getBlockParentUids_custom(tempUID);
    let Hierarchy, originalStr = "";
    if (!includeOrigin) {
      Hierarchy = ParentHierarchy;
    } else {
      originalStr = await getBlockStringByUID(tempUID) || "";
      Hierarchy = [
        ...ParentHierarchy,
        [
          { uid: tempUID, string: originalStr },
          { title: "made-up", uid: "invalid" }
        ]
      ];
    }
    return {
      blockStrings: Hierarchy.map((arr) => arr[0]).map((o) => ({
        string: clean_rm_string(o.string),
        uid: o.uid
      })),
      originBlockObj: {
        string: originalStr,
        uid: tempUID
      }
    };
  }
  function TryToReorderTmParams(p, url2) {
    const t = "start|t";
    p = p ?? t;
    p = p.includes("t") ? t : "end";
    const o = p.includes("t") ? "end" : t;
    const wrongOrderRegex = new RegExp(
      `(${paramRgx(o).source})(.*&)(${paramRgx(p).source})`
    );
    if (wrongOrderRegex.test(url2))
      url2 = url2.replace(wrongOrderRegex, "$6$5$1");
    return url2;
  }
  async function TryToAssertHierarchyUrl({ uid }) {
    const { foundBlock } = await getLastAnchorCmptInHierarchy(uid, false);
    if (!foundBlock?.lastUrl)
      return "";
    return foundBlock.lastUrl;
  }
  async function ExamineResObj(resObj) {
    const { capture, from, to } = resObj;
    const { contentObj, matchObj, hiddenObj } = UrlBtnAction2InfoObj(capture);
    const { lastUrl, url: url2 } = await TryGetUrlMatches(resObj, matchObj);
    matchObj.match = url2;
    contentObj.hidden = TryAssignMatch(contentObj);
    contentObj.hidden = TryToRemoveRedundantTmParam(
      contentObj,
      getPearTimestamp(from, "self")
    );
    matchObj.match = tryFmt_timestamp({
      page: from.page,
      value: getPearTimestamp(from).timestamp,
      match: matchObj.match
    });
    if (["start", "end"].some((p) => p == to[0])) {
      const foundUrl = getFmtUrl(to, url2);
      const lastFmtUrl = getLastFmtUrl(to, lastUrl);
      if (differentUrls(hiddenObj, foundUrl, lastFmtUrl)) {
        const c = getConcatS(contentObj.hidden);
        contentObj.hidden += `${c + foundUrl} `;
      }
    } else if (["start", "end"].some((p) => p == from.page)) {
      if (isSelected(UI$1.display.fmt_options, "lift_pears")) {
        const pearCaptureObj = await RemovePearFromString(from, resObj);
        matchObj.match = await tryFmt_timestamp_pear(
          pearCaptureObj?.matchObj?.match,
          matchObj.match,
          from
        );
        contentObj.hidden += TryToAppendHiddenPearContent(
          pearCaptureObj,
          contentObj
        );
        contentObj.hidden = TryToRemoveRedundantTmParam(
          contentObj,
          getPearTimestamp(from, "pear")
        );
      }
    }
    if (["url", "yt-gif"].some((t) => t == to[0])) {
      matchObj.match = TryToReorderTmParams(from.page, matchObj.match);
    }
    return {
      url: matchObj.match,
      hidden: contentObj.hidden,
      space: resObj.string[resObj.end]
    };
  }
  function differentUrls(hiddenObj, fmtUrl, lastFmtUrl) {
    return !hiddenObj?.match?.includes?.(fmtUrl) && fmtUrl != lastFmtUrl;
  }
  function getLastFmtUrl(to, lastUrl) {
    const param = !lastUrl ? { fmtUrl: null } : fmtUrlsObj(to, ExtractParamsFromUrl(lastUrl));
    return param.fmtUrl;
  }
  function getFmtUrl(to, url2) {
    const param = fmtUrlsObj(to, ExtractParamsFromUrl(url2));
    return param.fmtUrl;
  }
  async function TryGetUrlMatches(resObj, matchObj) {
    let _match = matchObj.match;
    const lastUrl = await TryToAssertHierarchyUrl(resObj);
    if (!_match && SelectedRelyOnHierarchy()) {
      _match = lastUrl;
    }
    if (!_match) {
      throw new Error(`YT GIF URL Formatter: Missing video url...`);
    }
    return {
      lastUrl,
      url: GetUrl(matchObj, _match)
    };
  }
  function TryAssignMatch(contentObj) {
    if (typeof contentObj.match == "undefined") {
      return contentObj.content;
    }
    return contentObj.hidden;
  }
  function GetUrl({ type }, _match) {
    return type == "minimal" ? "https://youtu.be" + _match : _match;
  }
  function SelectedRelyOnHierarchy() {
    return isSelected(UI$1.display.fmt_options, "rely_on_hierarchy");
  }
  function fmtTimestampsUrlObj(targetNode, innerWrapperSel = ".yt-gif-url-btns") {
    const urlBtn = GetUrlBtn(targetNode, innerWrapperSel);
    StopPropagations(urlBtn, targetNode);
    const { getters: _, trim, concatNoCmpt } = Format();
    return {
      startTm,
      endTm,
      urlBtn,
      confirmBtns: GetConfirmBtns(btnNames, urlBtn),
      async ytGifCmpt(o) {
        o.to = ["yt-gif"];
        await ExamineResObj(o).then(trim);
        return `{{[[yt-gif]]: ${_.u} ${_.h}}}`;
      },
      async startCmpt(o) {
        o.to = ["start"];
        await ExamineResObj(o).then(trim);
        return `{{[[yt-gif/start]]: ${startTm(_.u)} ${_.h}}}`;
      },
      async endCmpt(o) {
        o.to = ["end"];
        await ExamineResObj(o).then(trim);
        return `{{[[yt-gif/end]]: ${endTm(_.u)} ${_.h}}}`;
      },
      async startEndCmpt(o) {
        o.to = ["start", "end"];
        await ExamineResObj(o).then(trim);
        return `{{[[yt-gif/start]]: ${startTm(_.u)} ${_.h}}} {{[[yt-gif/end]]: ${endTm(_.u)} }}`;
      },
      async compt2Url(o) {
        o.to = ["url"];
        await ExamineResObj(o).then(trim).then(concatNoCmpt);
        return `${_.u}${_.h}`;
      }
    };
  }
  async function TryToUpdateBlock_fmt({
    block,
    targetNode,
    siblingSel,
    selfSel,
    getMap,
    isKey: isKey2,
    fmtCmpnt_cb,
    tempUID,
    from
  }) {
    const siblingIndex = ElementsPerBlock(block, siblingSel).indexOf(targetNode);
    const selfIndex = NonReferencedPerBlock(block, selfSel, targetNode).indexOf(
      targetNode
    );
    const map = await getMap();
    const ObjAsKey = ObjKey_AtIndexInMap(map, siblingIndex, isKey2);
    const { uid, capture } = ObjAsKey ?? {};
    if (!capture || !uid || selfIndex == -1)
      return;
    const res = await TryToUpdateBlockSubString(uid, selfIndex, capture, null);
    if (!res?.success)
      return;
    try {
      const replaceObj = { ...res, capture, from, replace: "" };
      replaceObj.replace = await fmtCmpnt_cb(replaceObj);
      await updateBlock(uid, replaceString(replaceObj), res.open);
      UIDtoURLInstancesMapMap.delete(uid);
      UIDtoURLInstancesMapMap.delete(tempUID);
    } catch (error) {
      const _from = from;
      const tp = _from?.urlBtn?.closest("[data-tooltip]");
      const err = `${error?.message} ((${tempUID}))`;
      console.error(err);
      return tp?.setAttribute("data-tooltip", err);
    }
    return { success: true };
  }
  async function OnYtGifUrlBtn$1(e, fmtCmpnt_cb, instance) {
    e.preventDefault();
    e.stopPropagation();
    await TryToUpdateBlock_fmt(settings(e, fmtCmpnt_cb, instance, {}));
  }
  async function OnYtGifInsertBtn(e, fmtCmpnt_cb, instance, fromObj = {}) {
    e.preventDefault();
    e.stopPropagation();
    await TryToUpdateBlock_fmt(settings(e, fmtCmpnt_cb, instance, fromObj));
  }
  function settings(e, fmtCmpnt_cb, instance, fromObj = {}) {
    return {
      block: instance.grandParentBlock,
      targetNode: instance.wrapper,
      siblingSel: ".yt-gif-wrapper",
      selfSel: `[data-video-url="${instance.url}"]`,
      getMap: async () => getUrlMap_smart(instance.uid),
      isKey: "is component",
      tempUID: instance.uid,
      from: {
        caster: "player",
        page: "yt-gif",
        urlBtn: e.target,
        ...fromObj
      },
      fmtCmpnt_cb
    };
  }
  function ValidUrlBtnUsage() {
    const key = s_u_f_key;
    const binarySessionVal = (k) => isTrue(
      window.YT_GIF_DIRECT_SETTINGS?.get(
        "ms_options"
      )?.sessionValue?.includes?.(k)
    );
    const usageKey = binarySessionVal("override_" + key) || isTrue(localStorage.getItem(key));
    return usageKey && binarySessionVal(key);
  }
  function valid_url_formatter() {
    return isSelected(UI$1.display.ms_options, s_u_f_key) && ValidUrlBtnUsage();
  }
  function tryToInsertControls(instance, record) {
    const { wrapper } = instance;
    appendVerticalUrlBtns(
      wrapper.querySelector("[insertOptions]"),
      "insertOptions"
    );
    const iframe2urlObj = fmtIframe2Url(wrapper, "[insertOptions]");
    if (!valid_url_formatter())
      return iframe2urlObj?.confirmBtns();
    AppendURLButtons(wrapper, instance);
    AppendInsertButtons(iframe2urlObj, record, instance);
  }
  function AppendInsertButtons(iframe2urlObj, record, instance) {
    const { instParam, urlBtn: instBtn } = iframe2urlObj;
    const t = () => record?.wTarget;
    const tick = () => parseInt(t()?.getCurrentTime()?.toString()) || 0;
    const rate = () => t()?.getPlaybackRate() || 1;
    const InsertBtn = (e, o) => OnYtGifInsertBtn(e, instParam, instance, o);
    instBtn("start").onclick = async (e) => InsertBtn(e, { param: "t", value: tick() });
    instBtn("end").onclick = async (e) => InsertBtn(e, { param: "end", value: tick() });
    instBtn("speed").onclick = async (e) => InsertBtn(e, { param: "s", value: rate(), float: true });
  }
  function AppendURLButtons(wrapper, instance) {
    appendVerticalUrlBtns(wrapper.querySelector("[formatter]"));
    const { startCmpt, endCmpt, startEndCmpt, compt2Url, urlBtn, confirmBtns } = fmtTimestampsUrlObj(wrapper, "[formatter]");
    urlBtn("url").onclick = async (e) => OnYtGifUrlBtn$1(e, compt2Url, instance);
    urlBtn("start").onclick = async (e) => OnYtGifUrlBtn$1(e, startCmpt, instance);
    urlBtn("end").onclick = async (e) => OnYtGifUrlBtn$1(e, endCmpt, instance);
    urlBtn("start|end").onclick = async (e) => OnYtGifUrlBtn$1(e, startEndCmpt, instance);
    confirmBtns();
  }
  async function ClickOnTimestamp(target, override = {}) {
    const seekToMessage = UI$1.timestamps.tm_seek_to.value == "soft" ? "seekTo-soft" : "seekTo-strict";
    const event = {
      ...{},
      currentTarget: target,
      which: 1,
      mute: UI$1.timestamps.tm_seek_action.value == "mute",
      simMessage: override.simMessage || "",
      seekToMessage: override.seekToMessage || seekToMessage
    };
    await target?.OnClicks?.(event);
  }
  function TryToSetLastActiveTimestamp(setObsTimestamp, lastActive) {
    const lastActiveTimestamp = lastActive.find(
      (aO) => aO?.target?.timestamp && aO.blockID
    );
    setObsTimestamp(lastActiveTimestamp);
  }
  async function TryToRecoverActiveTimestamp(getCrrContainer, commonObj, assign2ClickEvent = {}) {
    if (!commonObj) {
      console.warn("Passed null common object");
      return;
    }
    await sleep(10);
    const rm_container = getCrrContainer();
    const children = (sel2, self) => !self ? rm_container?.queryAllasArr(sel2) : [rm_container, ...rm_container?.queryAllasArr(sel2)];
    let active_block = children(".roam-block")[commonObj.blockIndex];
    const block = document.getElementById(commonObj.blockID);
    if (block != active_block && commonObj.workflow == "strict") {
      if (!rm_container.contains(block)) {
        return;
      }
      active_block = block;
    }
    const timestamps = ElementsPerBlock(active_block, "[yt-gif-timestamp-emulation]") || [];
    const targetTimestamp = timestamps[commonObj.target.index] || timestamps[commonObj.start.index] || timestamps[commonObj.end.index] || timestamps[timestamps.length - 1];
    await ClickOnTimestamp(targetTimestamp, assign2ClickEvent);
  }
  async function AssertParamsClickTimestamp({ getCrrContainer, getObsTimestamp }, configParams) {
    const lastActive = getObsTimestamp();
    if (!UI$1.display.simulate_roam_research_timestamps.checked || !UI$1.timestamps.tm_recovery.checked || !lastActive) {
      return;
    }
    await TryToRecoverActiveTimestamp(getCrrContainer, lastActive);
    await sleep(10);
    const tryActiveTm = (p) => configParams[p].set((crr) => {
      const tm = TryGetTimestampAttr(getCrrContainer, p);
      return HMSToSecondsOnly(tm) || crr;
    });
    tryActiveTm("start");
    tryActiveTm("end");
  }
  function TryGetTimestampAttr(getCrrContainer, page) {
    return getCrrContainer()?.querySelector(
      `.rm-video-timestamp[timestamp-style="${page}"][active-timestamp]`
    )?.getAttribute("timestamp") || "";
  }
  function DeployAsync({
    getLocalBlockID,
    setObsTimestamp,
    getCrrContainer,
    getObsTimestamp
  }, o) {
    const { wrapper, url: url2, configParams, deploy: deploy2 } = o;
    const mainAnimation = setUpWrapperAwaitingAnimation();
    const { awaiting_input_type } = UI$1.experience;
    let interactionType = awaiting_input_type.value == "mousedown" ? "mousedown" : "mouseenter";
    AddInteractionEventListener();
    wrapper.addEventListener("customPlayerReady", CustomListener);
    awaiting_input_type.addEventListener("change", changeMouseEvents);
    function CustomListener(e) {
      return Create(e, HandleDetailEvent);
    }
    function MouseListener(e) {
      return Create(e, HandleMouseEvent);
    }
    async function Create(e, Work_cb) {
      e.preventDefault();
      e.stopPropagation();
      toggleClasses(false, mainAnimation, wrapper);
      removeIMGbg(wrapper);
      RemoveAllListeners();
      await Work_cb(e);
      deploy2();
    }
    async function HandleMouseEvent() {
      await AssertParamsClickTimestamp(
        { getCrrContainer, getObsTimestamp },
        configParams
      );
      wrapper.dispatchEvent(simHover());
    }
    function HandleDetailEvent(e) {
      if (!e.detail || typeof e.detail !== "object") {
        return;
      }
      trySet("start");
      trySet("end");
      lastBlockIDParameters.delete(getLocalBlockID());
      trySet("updateTime");
      trySet("mute");
      trySet("playRightAway");
      setObsTimestamp({
        ...e.detail.obsTimestamp,
        workflow: "soft"
      });
      configParams.updateTime.set(
        isBounded(get("updateTime")) ? get("updateTime") : get(e.detail.page)
      );
      function get(key) {
        return configParams[key].value;
      }
      function trySet(key) {
        configParams[key].set((crr) => e.detail[key] ?? crr);
      }
      function isBounded(t) {
        return t >= get("start") && t <= get("end");
      }
    }
    function RemoveAllListeners() {
      RemoveInteractionEventListener();
      wrapper.removeEventListener("customPlayerReady", CustomListener);
      awaiting_input_type.removeEventListener("change", changeMouseEvents);
    }
    function ReplaceInteractionEventListener(listener = interactionType) {
      RemoveInteractionEventListener();
      AddInteractionEventListener(interactionType = listener);
    }
    function AddInteractionEventListener(listener = interactionType) {
      wrapper.addEventListener(listener, MouseListener);
    }
    function RemoveInteractionEventListener() {
      wrapper.removeEventListener(interactionType, MouseListener);
    }
    function changeMouseEvents() {
      if (!isRendered(wrapper)) {
        return RemoveAllListeners();
      }
      ReplaceInteractionEventListener(this.value);
    }
    function setUpWrapperAwaitingAnimation() {
      const {
        awiting_player_pulse_anim,
        awaitng_player_user_input,
        awaitng_input_with_thumbnail
      } = cssData;
      const awaitingAnimation = [
        awiting_player_pulse_anim,
        awaitng_player_user_input
      ];
      const awaitingAnimationThumbnail = [
        ...awaitingAnimation,
        awaitng_input_with_thumbnail
      ];
      const mainAnimation2 = awaitingAnimationThumbnail;
      if (isSelected(UI$1.experience.xp_options, "thumbnail_as_bg"))
        applyIMGbg(wrapper, url2);
      toggleClasses(true, mainAnimation2, wrapper);
      return mainAnimation2;
    }
  }
  function isIntersection_selectedValid() {
    return isIntersectionSeletectd() && isInputBufferSelected();
  }
  function isInput_selectedValid() {
    return isInputSelected() || !isIntersectionSeletectd() && isInputBufferSelected() || isSelected(UI$1.experience.initialize_mode, "overflow");
  }
  function isInputSelected() {
    return isSelected(UI$1.experience.initialize_mode, "input");
  }
  function isIntersectionSeletectd() {
    return isSelected(UI$1.experience.xp_options, "intersection");
  }
  function isInputBufferSelected() {
    return isSelected(UI$1.experience.initialize_mode, "input_x_buffer");
  }
  function FitBuffer(arr, cap, creation) {
    let atLeastOne = false;
    let lastOne = null;
    let stop = arr.length + 0;
    let ini = 0;
    while (arr.length > cap) {
      if (stop < 0)
        throw new Error("index out of bounds");
      lastOne = arr[ini];
      const wrapper = document.querySelector(lastOne);
      if (wrapper) {
        const newCreation = isElementVisible(wrapper) ? attrInfo.creation.forceAwaiting : creation;
        CleanAndBrandNewWrapper(
          wrapper,
          attrInfo.creation.name,
          newCreation
        );
      } else {
        ini++;
      }
      arr.shift();
      atLeastOne = true;
      stop--;
    }
    arr = [...new Set(arr)];
    arr = arr.filter((sel2) => document.querySelector(sel2) != null);
    return { shiftedArr: arr, atLeastOne, lastOne };
  }
  function FitBuffer_OffScreen(arr, cap, creation) {
    const anyLoaded = document.queryAllasArr(".yt-gif-wrapper");
    if (anyLoaded.length < cap)
      return arr;
    for (const element of anyLoaded) {
      const observer = new window.IntersectionObserver(
        ([entry], observer2) => {
          if (entry.isIntersecting)
            return arr;
          const { shiftedArr } = FitBuffer(arr, cap, creation);
          arr = shiftedArr;
          observer2.disconnect();
          return window.YT_GIF_OBSERVERS.masterIframeBuffer = arr;
        },
        { root: null, threshold: 0.1 }
      );
      observer.observe(element);
      return arr;
    }
    return arr;
  }
  function toggle_buffers_overflow(bol2) {
    const modes = UI$1.experience.initialize_mode;
    const input_x_buffer = getOption(modes, "input_x_buffer");
    input_x_buffer.disabled = bol2;
    if (!bol2)
      input_x_buffer.selected = false;
    getOption(modes, "overflow").selected = bol2;
    modes.dispatchEvent(new Event("customBind"));
  }
  function PushNew_ShiftAllOlder_IframeBuffer(parentCssPath) {
    if (parentCssPath)
      window.YT_GIF_OBSERVERS.masterIframeBuffer = pushSame(
        window.YT_GIF_OBSERVERS.masterIframeBuffer,
        parentCssPath
      );
    ifBuffer_ShiftOldest();
  }
  function ifBuffer_ShiftOldest() {
    if (isInputSelected())
      return null;
    let arr = window.YT_GIF_OBSERVERS.masterIframeBuffer;
    const cap = parseInt(UI$1.range.iframe_buffer_slider.value, 10);
    const { displaced, buffer } = attrInfo.creation;
    if (isIntersection_selectedValid()) {
      arr = FitBuffer_OffScreen(arr, cap, displaced);
    } else {
      const { shiftedArr, atLeastOne: shifted } = FitBuffer(arr, cap, buffer);
      arr = shiftedArr;
      if (shifted || cap <= arr.length) {
        toggle_buffers_overflow(true);
      } else if (!shifted && cap > arr.length) {
        toggle_buffers_overflow(false);
      }
    }
    return window.YT_GIF_OBSERVERS.masterIframeBuffer = arr;
  }
  function DeactivateTimestampsInHierarchy(rm_container, targetWrapper) {
    if (!rm_container)
      return;
    const sel2 = "[yt-gif-timestamp-emulation]";
    const all = TimestampsInHierarchy(rm_container, targetWrapper, sel2);
    all.forEach((el) => {
      toggleAttribute(false, "active-timestamp", el);
      toggleAttribute(false, "last-active-timestamp", el);
    });
  }
  function TimestampsInHierarchy(rm_container, targetWrapper, allSelector) {
    const badSets = rm_container.queryAllasArr(".yt-gif-wrapper").filter((w) => w != targetWrapper).map((w) => closest_container_request(w)?.queryAllasArr(allSelector)).flat(Infinity);
    const actives = Array.from(
      rm_container.querySelectorAll(allSelector)
    ).filter((tm) => !badSets.includes(tm));
    return actives;
  }
  function ValidateHierarchyTimestamps(wrapper, t) {
    const videoId = t.GetVideoID();
    YTvideoIDs.set(videoId, t.getDuration?.());
    const d = YTvideoIDs.get(videoId);
    const rm_container = closest_anchor_container(wrapper);
    if (rm_container && typeof d == "number")
      TimestampsInHierarchy(
        rm_container,
        wrapper,
        "[yt-gif-timestamp-emulation]"
      ).forEach((tm) => tm.validateSelf?.(d));
  }
  function CanUnmute() {
    return !muteIs("soft") && !muteIs("all_muted");
  }
  function muteIs(v) {
    return UI$1.playerSettings.mute_style.value == v;
  }
  function playIs(v) {
    const play = UI$1.playerSettings.play_style;
    const is = play.value == v;
    return is;
  }
  function anyValidInAndOutKey(e) {
    if (e.buttons == 4) {
      return true;
    }
    return UI$1.defaultValues.InAndOutKeys.split(",").map((s) => s.trim()).filter((s) => !!s).some((k) => e[k]);
  }
  function AnyPlayOnHover() {
    return playIs("soft") || playIs("strict");
  }
  function GetHoverStates(q) {
    return {
      stop(e) {
        q.parent.others.toggleActive();
        q.target.others.StrictFlow();
        q.UpdateLocalVolume();
        q.UpdateHumanInteraction(false);
        if (anyValidInAndOutKey(e) && !muteIs("all_muted")) {
          q.parent.toggleActive(true);
          q.videoIsPlayingWithSound();
        } else {
          q.parent.toggleActive(false);
          q.togglePlay(!AnyPlayOnHover() && q.isPlaying());
          q.isSoundingFine(false);
        }
      },
      play() {
        if (isSelected(
          UI$1.playerSettings.ps_options,
          "mantain_last_active_player"
        ))
          q.parent.others.toggleActive();
        q.target.others.StrictFlow();
        q.UpdateHumanInteraction(true);
        q.togglePlay(true);
        if (CanUnmute()) {
          q.isSoundingFine();
        } else if (muteIs("soft")) {
          q.isSoundingFine(false);
        }
      }
    };
  }
  function setupPreviousParams(o, q) {
    const session = lastBlockIDParameters.get(o.entry.blockID);
    if (!session) {
      return;
    }
    const { url_boundaries, url_volume } = UI$1.playerSettings;
    const start = GetPreviousStart(session, url_boundaries.value, o.entry.start, q.isBounded);
    if (start != void 0) {
      q.seekToUpdatedTime(start);
    }
    const volume = GetPreviousVolume(session, url_volume.value, o.entry.volume);
    if (volume != void 0) {
      o.update.volume = volume;
    }
  }
  function GetPreviousVolume(session, value, entryVal) {
    if (value == "strict") {
      const vl_Hist = session.volume.history;
      if (vl_Hist[vl_Hist.length - 1] != entryVal) {
        vl_Hist.push(entryVal);
        return entryVal;
      } else
        return session.volume.update;
    } else if (value == "soft")
      return session.volume.update;
  }
  function GetPreviousStart(session, value, entryVal, isBounded) {
    if (value == "strict") {
      const timeHist = session.timestamps.history;
      if (timeHist[timeHist.length - 1] != entryVal) {
        timeHist.push(entryVal);
        return entryVal;
      } else {
        return session.updateTime.value;
      }
    } else if (value == "soft" && isBounded(session.updateTime.value)) {
      return session.updateTime.value;
    }
  }
  function* FlipStyleGenerator(o) {
    let bol2 = true;
    while (true) {
      UI$1.playerSettings.play_style = Flip(
        UI$1.playerSettings.play_style,
        bol2,
        o.play
      );
      UI$1.playerSettings.mute_style = Flip(
        UI$1.playerSettings.mute_style,
        bol2,
        o.mute
      );
      UI$1.display.yt_playback_speed = Flip(
        UI$1.display.yt_playback_speed,
        bol2,
        o.playback
      );
      bol2 = yield bol2;
    }
  }
  function GetStyleCallbacks(iframe, q, t, map, local) {
    return {
      play: GetFuncPlay(iframe, q),
      mute: GetFuncMute(iframe, q),
      playback: GetFuncPlayback(t, map, local)
    };
  }
  function GetFuncPlay(iframe, q) {
    return function() {
      if (!isElementVisible(iframe))
        return;
      if (playIs("all_visible")) {
        q.togglePlay(true);
        q.isSoundingFine(false);
      } else if (AnyPlayOnHover()) {
        q.togglePlay(!AnyPlayOnHover());
      }
    };
  }
  function GetFuncMute(iframe, q) {
    return function() {
      if (!isElementVisible(iframe))
        return;
      if (muteIs("strict") || muteIs("all_muted")) {
        q.isSoundingFine(false);
      }
    };
  }
  function GetFuncPlayback(t, map, local) {
    return function() {
      const value = UI$1.display.yt_playback_speed.value;
      const speed = value == "Default" ? map.speed.value : Number(value);
      local.update.tickOffset = 1e3 / speed;
      t.setPlaybackRate(speed);
    };
  }
  function Flip(binaryInput, bol2 = false, cb = () => {
  }) {
    if (binaryInput?.tagName) {
      if (bol2)
        binaryInput.addEventListener("change", cb);
      else
        binaryInput.removeEventListener("change", cb);
    }
    return binaryInput;
  }
  function TimeTargetObj(q, iframe, map, local, t, l) {
    function NewIntervalUpdate() {
      if (!isRendered(iframe)) {
        return t.DestroyTarget();
      }
      if (!q.whole.anyHover()) {
        return;
      }
      UpdateTimeDisplay();
      t.ytgif.PushSingleInterval(() => {
        if (q.whole.anyHover()) {
          UpdateTimeDisplay();
        }
      }, local.update.tickOffset);
    }
    function UpdateTimeDisplay() {
      const span2 = q.clipSpan();
      const offsetClip = span2 < 0;
      const offsetStart = q.tick() > map.end.value;
      toggleAttribute(offsetStart, "tick-offset", l.timeDisplayStart);
      toggleAttribute(offsetClip, "offset", l.timeDisplayEnd);
      if (isSelected(UI$1.display.ms_options, "clip_lifespan_format")) {
        const boundedTick = Math.abs(span2 - (map.end.value - q.tick()));
        const validEnd = offsetClip ? map.end.value : span2;
        l.timeDisplayStart.textContent = fmtMSS(boundedTick);
        l.timeDisplayEnd.textContent = fmtMSS(validEnd);
      } else {
        l.timeDisplayStart.textContent = fmtMSS(q.tick());
        l.timeDisplayEnd.textContent = fmtMSS(map.end.value);
      }
    }
    return {
      NewIntervalUpdate,
      UpdateTimeDisplay,
      SeekToScroll(e) {
        q.videoIsPlayingWithSound(false);
        let dir = q.tick() + Math.sign(e.deltaY) * Math.round(
          Number(UI$1.range.timestamp_display_scroll_offset.value)
        ) * -1;
        if (isSelected(UI$1.display.ms_options, "clip_lifespan_format")) {
          if (dir <= map.start.value) {
            dir = map.end.value - 1;
          }
          if (dir >= map.end.value) {
            dir = map.start.value;
          }
        }
        t.seekTo(dir);
        UpdateTimeDisplay();
        setTimeout(() => {
          if (q.whole.anyHover()) {
            q.videoIsPlayingWithSound();
          }
        }, local.update.tickOffset);
      }
    };
  }
  function fmtMSS(seconds) {
    const format = (val) => `0${Math.floor(val)}`.slice(-2);
    const hours = seconds / 3600;
    const minutes = seconds % 3600 / 60;
    const displayFormat = hours < 1 ? [minutes, seconds % 60] : [hours, minutes, seconds % 60];
    return displayFormat.map(format).join(":");
  }
  async function TryReloadVideo({
    t,
    start,
    end
  }) {
    if (!t)
      return;
    const vars = t.GetVars();
    const map = allVideoParameters.get(t.GetIframeID());
    if (!map) {
      console.warn(
        `YT GIF: ReloadYTVideo: Couldn't find VideoConfigParameters for ${t.GetIframeID()}`
      );
    }
    const iframe = t.getIframe();
    start = start || 0;
    end = end || t.getDuration();
    if (map?.start.value == start && map?.end.value == end) {
      while (isRendered(iframe) && !t.ApiIsWorking()) {
        await sleep(50);
      }
      return t.seekTo(start);
    }
    map?.start.set(vars.start = start);
    map?.end.set(vars.end = end);
    const vol = t.getVolume();
    while (isRendered(iframe) && !t.ApiIsWorking()) {
      await sleep(50);
    }
    if (t.getPlayerState() ?? 0) {
      t.setPlayerState("F");
    }
    try {
      t.setOnStateChange(async () => {
      });
    } catch (error) {
      console.warn(
        "YT GIF: ReloadYTVideo | onStateChange assignment to undefined"
      );
    }
    await t.loadVideoById({
      videoId: t.GetVideoID(),
      startSeconds: start,
      endSeconds: end
    });
    while (isRendered(iframe) && !t.getCurrentTime()) {
      await sleep(50);
    }
    t.setVolume(vol);
    try {
      t.setOnStateChange(window.AvoidCircularDependency.getOnStateChange());
    } catch (error) {
      console.error(
        "YT GIF: ReloadYTVideo | onStateChange assignment to undefined"
      );
    }
  }
  function awaitingAtrr(bol2, el) {
    return toggleAttribute(bol2, "awaiting", el);
  }
  function GetFuncResetBoundaries(t, q, l, map, time, local) {
    return async function(evt) {
      const tEl = evt?.currentTarget ?? l.resetBtn;
      const awaiting = (bol2) => awaitingAtrr(bol2, tEl);
      if (tEl.hasAttribute("awaiting"))
        return;
      q.timeDisplay.visible(true);
      awaiting(true);
      DeactivateTimestampsInHierarchy(closest_anchor_container(tEl), l.parent);
      await TryReloadVideo({
        t,
        start: map.start.default,
        end: map.end.default
      });
      q.seekToUpdatedTime(map.start.default ?? 0);
      time.UpdateTimeDisplay();
      awaiting(false);
      if (evt?.message != "update-timestamp") {
        return q.timeDisplay.visible(false);
      }
      time.UpdateTimeDisplay();
      t.ytgif.timerID = window.setInterval(
        () => time.UpdateTimeDisplay(),
        local.update.tickOffset
      );
      t.ytgif.timers.push(t.ytgif.timerID);
      l.timeDisplay.onmousemove = stopUpdateDisplayOnce;
    };
    function stopUpdateDisplayOnce(e) {
      e.stopPropagation();
      e.preventDefault();
      q.timeDisplay.visible(false);
      e.currentTarget.onmousemove = null;
    }
  }
  function GetElementsObj(key, t) {
    const iframe = document.getElementById(key) || t.getIframe();
    const parent = getParent(iframe);
    const timeDisplay = parent.querySelector(
      "div." + cssData.yt_gif_timestamp
    );
    const timeDisplayStart = timeDisplay.querySelector(
      ".yt-gif-timestamp-start"
    );
    const timeDisplayEnd = timeDisplay.querySelector(".yt-gif-timestamp-end");
    const resetBtn = parent.querySelector(
      '[yt-gif-url-btn="reset"]'
    );
    const withEventListeners = [
      parent,
      parent.parentNode,
      timeDisplay,
      iframe
    ];
    return {
      blockID: getBlockID$1(iframe),
      iframe,
      parent,
      timeDisplay,
      resetBtn,
      withEventListeners,
      timeDisplayStart,
      timeDisplayEnd
    };
  }
  function getBlockID$1(iframe) {
    return closestYTGIFparentID(iframe) + getWrapperUrlSufix(getParent(iframe));
  }
  function getParent(i) {
    return i.closest("." + cssData.yt_gif_wrapper) || i.parentElement;
  }
  function GetOnIframeRemovedFromDom(flipIterator, t, q, map, entry, elements) {
    return async () => {
      const { iframe, parent } = elements;
      const { blockID, blcokID_prfx, volume, canBeCleanedByBuffer, key } = entry;
      RemoveElsEventListeners(elements.withEventListeners);
      flipIterator.next(false);
      const session = lastBlockIDParameters.get(blockID) ?? videoParams;
      const media = Clone(session);
      media.src.set(getWrapperUrlSufix(parent));
      media.id.set(map.id.value);
      media.updateTime.set(q.isBounded(q.tick()) ? q.tick() : map.start.value);
      media.volume.update = t.getVolume() ?? map.volume.update;
      if (media.timestamps.history.length == 0) {
        media.timestamps.history.push(map.start.value);
      }
      if (media.volume.history.length == 0) {
        media.volume.history.push(volume);
      }
      t.ytgif.ClearTimers();
      recordedIDs.delete(blockID);
      allVideoParameters.delete(key);
      const prefix = closestYTGIFparentID(iframe) ?? blcokID_prfx;
      const suffix = parent.getAttribute(attrInfo.url.index);
      for (const key2 of lastBlockIDParameters.keys()) {
        const remove = () => lastBlockIDParameters.delete(key2);
        const isYTgif = key2?.endsWith(suffix) && key2?.includes(media.id.value);
        const isBlock = key2.startsWith(prefix);
        if (isYTgif && isBlock) {
          remove();
          continue;
        }
        if (!isYTgif) {
          continue;
        }
        const wasDeletedExternally = canBeCleanedByBuffer && await isBlockRef(prefix.slice(-9));
        if (wasDeletedExternally) {
          console.log("yt-gif debugger");
          remove();
        }
      }
      if (blockID != null) {
        lastBlockIDParameters.set(blockID, media);
      }
      if (canBeCleanedByBuffer) {
        ifBuffer_ShiftOldest();
      }
      const targetExist = document.querySelector("#" + key) == iframe;
      if (targetExist) {
        return console.log(
          `${key} is displaced, not removed, thus is not destroyed.`
        );
      }
      setTimeout(() => {
        if (targetExist) {
          return;
        }
        t.DestroyTarget();
        const TRY = TryToGetPreviousParent(key);
        if (!TRY) {
          return;
        }
        const { previousParent, observerTarget } = TRY;
        previousParent.parentNode?.replaceChild(
          observerTarget,
          previousParent
        );
      }, 1e3);
    };
  }
  function TryToGetPreviousParent(key) {
    const previousIframe = document.querySelector("#" + key);
    if (!isRendered(previousIframe)) {
      return null;
    }
    const previousParent = getParent(previousIframe);
    if (!isRendered(previousParent)) {
      return null;
    }
    const observerTarget = div([
      window.AvoidCircularDependency.getCurrentClassesToObserver()[0]
    ]);
    return { previousParent, observerTarget };
  }
  function GetFuncPauseOffscreen(q, t, l) {
    const loadedAndBlurred = () => q.tick() > l.update.start + 1 && !t.ytgif.globalHumanInteraction;
    return (entries, observer) => {
      if (!entries[0] || !isRendered(entries[0].target)) {
        observer.disconnect();
        return;
      }
      if (loadedAndBlurred()) {
        if (!playIs("all_visible")) {
          return stopIfInactive(q);
        }
        if (entries[0].isIntersecting) {
          q.togglePlay(true);
        } else {
          stopIfInactive(q);
        }
      }
    };
  }
  function stopIfInactive(q) {
    if (!q.parent.isActive() || !isSelected(UI$1.playerSettings.ps_options, "mantain_last_active_player")) {
      return q.togglePlay(false);
    }
    q.parent.others.toggleActive();
    q.target.others.Mute();
    q.target.others.Pause();
  }
  function TryToPauseIfBlurred(q, play) {
    const bol2 = playIs("all_visible");
    play(bol2);
    if (bol2 && !q.parent.Hover() && q.isPlaying()) {
      play(false);
    }
  }
  function TryToPauseAfterASecond(q, play) {
    setTimeout(() => {
      if (!q.parent.isActive() && !q.parent.Hover()) {
        play(false);
      }
    }, 1e3);
  }
  function GetAutoplayParent(iframe) {
    return iframe.closest(".rm-alias-tooltip__content") || iframe.closest(".bp3-card") || iframe.closest(".myPortal");
  }
  function TryToRunPreviousParams(t, local, styleCallbacks) {
    try {
      t.setVolume(local.update.volume);
    } catch (error) {
      console.log(error);
    }
    styleCallbacks.playback();
  }
  async function AutoPlayToUpdate(iframe, t, q, map) {
    await t.WhileApiHolds(iframe);
    q.seekToUpdatedTime(map.updateTime.value ?? map.start.value);
    q.togglePlay(true);
    q.isSoundingFine(!map.mute.value);
    map.playRightAway.set(false);
  }
  async function TryFreezeAutoplay(iframe, t, q) {
    const parent = GetAutoplayParent(iframe);
    const play = (bol2) => q.videoIsPlayingWithSound(bol2);
    if (parent) {
      parent.dispatchEvent(simHover());
    } else if (q.parent.Hover()) {
      play(true);
      TryToPauseAfterASecond(q, play);
    } else {
      await t.WhileApiHolds(iframe, 200);
      const humanInteraction = t.ytgif.globalHumanInteraction;
      if (humanInteraction) {
        play(true);
      } else if (isElementVisible(iframe) && !humanInteraction) {
        TryToPauseIfBlurred(q, play);
      } else if (!q.parent.Hover()) {
        play(false);
      }
    }
  }
  function SoundIs(style, el) {
    StyleAttribute(ytGifAttr.sound, style, el);
  }
  function PlayIs(style, el) {
    StyleAttribute(ytGifAttr.play, style, el);
  }
  function StyleAttribute(subStyle, style, el) {
    ObjectKeys(subStyle).forEach((k) => el.removeAttribute(subStyle[k]));
    el.setAttribute(style, "");
  }
  function HandleOthers(iframe) {
    return {
      StrictFlow() {
        if (playIs("strict")) {
          Pause();
        } else if (muteIs("strict")) {
          Mute();
        }
      },
      Mute,
      Pause
    };
    function Mute() {
      LoopTroughYTGIFs(GetMuteOthersCongif);
    }
    function Pause() {
      LoopTroughYTGIFs(GetPauseOthersCongif);
    }
    function LoopTroughYTGIFs(config = fallback) {
      const frames = document.queryAllasArr(`[${config.styleQuery}]`);
      for (const i of frames) {
        const o = { el: i, id: getBlockID$1(i) };
        if (i != iframe) {
          config.others_callback(o);
        } else if (config.self_callback) {
          config.self_callback(o);
        }
      }
    }
  }
  const empty = (_o) => {
  };
  const GetMuteOthersCongif = {
    styleQuery: "yt-unmute",
    others_callback: (o) => {
      SoundIs("yt-unmute", o.el);
      recordedIDs.get(o.id)?.wTarget?.mute();
    },
    self_callback: empty
  };
  const GetPauseOthersCongif = {
    styleQuery: "yt-playing",
    others_callback: (o) => {
      PlayIs("yt-paused", o.el);
      recordedIDs.get(o.id)?.wTarget?.pauseVideo();
    },
    self_callback: empty
  };
  const fallback = {
    styleQuery: "",
    others_callback: empty,
    self_callback: empty
  };
  function GetElementsMethods(parent, iframe, timeDisplay, t) {
    const active = "yt-active";
    return {
      parent: {
        others: {
          toggleActive(bol2 = false) {
            document.queryAllasArr(`[${active}]`).filter((el) => el != parent).forEach((el) => toggleAttribute(bol2, active, el));
          }
        },
        toggleActive: (bol2) => toggleAttribute(bol2, active, parent),
        Hover: () => parent.matches(":hover"),
        isActive: () => parent.hasAttribute(active)
      },
      timeDisplay: {
        Hover: () => timeDisplay.matches(":hover"),
        OnCustomVideoEnded() {
          if (timeDisplay.classList.contains("yt-gif-timestamp-update")) {
            timeDisplay.onmousemove = null;
            this.visible(false);
            t.ytgif.ClearTimers();
          }
        },
        visible(bol2) {
          toggleClasses(bol2, ["yt-gif-timestamp-update"], timeDisplay);
          toggleClasses(!bol2, ["yt-gif-invisible-element"], timeDisplay);
        }
      },
      whole: {
        anyHover() {
          return parent.matches(":hover") || timeDisplay.matches(":hover");
        }
      },
      target: {
        others: HandleOthers(iframe)
      }
    };
  }
  function GetTarget(t) {
    return {
      tick: (_ = t) => _?.getCurrentTime(),
      closestRate(x) {
        const rates = t.getAvailablePlaybackRates() || [];
        return GetClosestRate(rates, x) || 1;
      },
      UpdateHumanInteraction(b) {
        t.ytgif.globalHumanInteraction = b;
      },
      isPlaying() {
        return t.getPlayerState() === 1;
      }
    };
  }
  function GetConfig(map) {
    return {
      clipSpan: () => map.end.value - map.start.value,
      isBounded: (x) => map.start.value < x && x < map.end.value,
      getMapVolume: () => {
        return videoParams.volume.value || 40;
      }
    };
  }
  function GetQuery(params) {
    const { parent, timeDisplay, iframe } = params;
    const { map, t, local } = params;
    return {
      ...GetElementsMethods(parent, iframe, timeDisplay, t),
      ...GetConfig(map),
      ...GetTarget(t),
      videoIsPlayingWithSound(boo = true) {
        this.isSoundingFine(boo);
        this.togglePlay(boo);
      },
      togglePlay(bol2, el = iframe) {
        if (bol2) {
          PlayIs("yt-playing", el);
          t.playVideo();
        } else {
          PlayIs("yt-paused", el);
          t.pauseVideo();
        }
      },
      isSoundingFine(bol2 = true, el = iframe) {
        if (bol2) {
          SoundIs("yt-unmute", el);
          t.unMute();
          t.setVolume(local.update.volume);
        } else {
          SoundIs("yt-mute", el);
          t.mute();
        }
      },
      UpdateLocalVolume(v) {
        v = v ?? t.getVolume();
        local.update.volume = v;
      },
      seekToUpdatedTime(desiredTime) {
        local.update.start = desiredTime;
        t.seekTo(local.update.start);
      }
    };
  }
  function TrySetupRecordID(recording, t, q) {
    if (!recording) {
      return;
    }
    recording.wTarget = t;
    recording.sameBoundaries = function(tg = t) {
      if (!tg)
        return false;
      const key = tg.GetIframeID();
      const { start: startM, end: endM } = allVideoParameters.get(key);
      const { start, end } = tg.GetVars();
      return startM.value == start && endM.value == end;
    };
    recording.seekToUpdatedTime = q.seekToUpdatedTime;
    recording.isSoundingFine = q.isSoundingFine;
    recording.togglePlay = q.togglePlay;
    recording.bounded = function(sec) {
      const d = t.getDuration() ?? 0;
      return sec >= 0 && sec <= d;
    };
  }
  async function Refurbish(local, t, q, iframe) {
    const session = lastBlockIDParameters.get(local.entry.blockID);
    if (session) {
      session.updateTime.set(t.ytgif.previousTick);
    }
    setupPreviousParams(local, q);
    await TryFreezeAutoplay(iframe, t, q);
  }
  function GetFullscreenCallbacks(q, t) {
    return {
      default() {
        setCurrentFullscreenPlayer(t.GetIframeID());
        if (document.fullscreenElement) {
          return;
        }
        if (q.parent.Hover()) {
          if ("mute" == UI$1.playerSettings.fullscreen_style.value) {
            q.isSoundingFine(false);
          } else if ("pause" == UI$1.playerSettings.fullscreen_style.value) {
            q.togglePlay(false);
          }
        } else if ("play" == UI$1.playerSettings.fullscreen_style.value) {
          q.togglePlay(true);
        }
      },
      autoplaySynergy() {
        if (document.fullscreenElement) {
          q.parent.others.toggleActive();
        } else if (playIs("all_visible")) {
          UI$1.playerSettings.play_style.dispatchEvent(new Event("change"));
        }
      }
    };
  }
  async function onPlayerReady(event) {
    const t = new YT_TargetWrapper(event.target);
    const key = t.GetIframeID();
    const l = GetElementsObj(key, t);
    const { iframe, parent, timeDisplay, resetBtn } = l;
    const map = allVideoParameters.get(key);
    map.start.set(map.start.value || 0);
    map.end.set(map.end.value || t.getDuration());
    const local = GetLocalObj(map, l, iframe);
    const q = GetQuery({
      map,
      parent,
      timeDisplay,
      t,
      iframe,
      local
    });
    map.speed.set(q.closestRate(map.speed.value || 1));
    TrySetupRecordID(recordedIDs.get(local.entry.blockID), t, q);
    const styleCallbacks = GetStyleCallbacks(iframe, q, t, map, local);
    if (parent.hasAttribute("loaded")) {
      await Refurbish(local, t, q, iframe);
      TryToRunPreviousParams(t, local, styleCallbacks);
      return;
    }
    iframe.removeAttribute("title");
    setupPreviousParams(local, q);
    const flipIterator = FlipStyleGenerator(styleCallbacks);
    flipIterator.next();
    const hover = GetHoverStates(q);
    parent.addEventListener("mouseenter", hover.play);
    parent.addEventListener("mouseleave", hover.stop);
    parent.addEventListener(
      "customVideoEnded",
      q.timeDisplay.OnCustomVideoEnded
    );
    const time = TimeTargetObj(q, iframe, map, local, t, l);
    t.ytgif.enter = time.NewIntervalUpdate;
    timeDisplay.addEventListener("wheel", time.SeekToScroll);
    timeDisplay.addEventListener("mouseenter", time.NewIntervalUpdate);
    timeDisplay.addEventListener("mouseleave", () => t.ytgif.ClearTimers());
    const fullscreen = GetFullscreenCallbacks(q, t);
    iframe.addEventListener("fullscreenchange", fullscreen.default);
    iframe.addEventListener("fullscreenchange", fullscreen.autoplaySynergy);
    const ResetBoundaries = GetFuncResetBoundaries(t, q, l, map, time, local);
    resetBtn.addEventListener("click", ResetBoundaries);
    resetBtn.ResetBoundaries_smart = ResetBoundaries;
    RemovedElementObserver({
      el: iframe,
      OnRemovedFromDom_cb: GetOnIframeRemovedFromDom(
        flipIterator,
        t,
        q,
        map,
        local.entry,
        l
      )
    });
    if (local.entry.canBeCleanedByBuffer && parent) {
      const parentCssPath = getUniqueSelectorSmart(parent);
      PushNew_ShiftAllOlder_IframeBuffer(parentCssPath);
    }
    const ViewportObserver = new IntersectionObserver(
      GetFuncPauseOffscreen(q, t, local),
      { threshold: [0] }
    );
    ViewportObserver.observe(iframe);
    if (map.playRightAway?.value && map.hasOwnProperty("updateTime")) {
      await AutoPlayToUpdate(iframe, t, q, map);
    } else {
      await TryFreezeAutoplay(iframe, t, q);
    }
    TryToRunPreviousParams(t, local, styleCallbacks);
    parent.setAttribute("loaded", "");
    iframe.addEventListener("load", () => t.ytgif.previousTick = q.tick());
    ValidateHierarchyTimestamps(parent, t);
  }
  function GetLocalObj(map, l, iframe) {
    const stats = {
      start: map.start.value,
      volume: map.volume.value,
      end: map.end.value
    };
    const local = {
      entry: {
        ...stats,
        blockID: l.blockID,
        blcokID_prfx: closestYTGIFparentID(iframe),
        canBeCleanedByBuffer: !!closestBlockID(iframe),
        key: iframe.id
      },
      update: { ...stats, tickOffset: 0 }
    };
    return local;
  }
  async function ClickResetWrapper(targetWrapper, assignObj = null) {
    if (!targetWrapper)
      return;
    const reset = targetWrapper.querySelector(
      '[yt-gif-url-btn="reset"]'
    );
    if (assignObj && "delete-obs-tm" in assignObj)
      reset.dispatchEvent(
        new CustomEvent("customDelObsTimestmp", {
          bubbles: true,
          cancelBubble: true,
          cancelable: true,
          detail: {
            blockID: assignObj.blockID
          }
        })
      );
    await reset?.ResetBoundaries_smart?.(assignObj);
  }
  function ReloadFlow(o) {
    if (o.activeIdx === -1 && (UI$1.timestamps.tm_loop_hierarchy.value == "active" || o.targets.length == 0)) {
      return { message: "reload-this" };
    }
    let nextIdx = (o.activeIdx + 1) % o.targets.length;
    if (o.includesPlayerOpt) {
      if (o.activeIdx == o.targets.length - 1) {
        return { message: "update-timestamp" };
      } else if (o.activeIdx == -1) {
        nextIdx = 0;
      }
    }
    const nextTarget = o.targets[nextIdx];
    if (isRendered(nextTarget)) {
      return { message: "seekTo-strict", target: nextTarget };
    } else {
      return { message: "reload-this" };
    }
  }
  function QueryTimestampObj(iframe, rm_container) {
    const options = Array.from(
      UI$1.timestamps.tm_loop_options.selectedOptions
    ).map((o) => o.value);
    const page = UI$1.timestamps.tm_loop_to.value || "start";
    const sel2 = `[timestamp-set][timestamp-style="${page}"]`;
    const boundedSel = `${sel2}:not([out-of-bounds])`;
    const tmSel = options.includes("skip") ? boundedSel : sel2;
    const wrapper = iframe.closest(".yt-gif-wrapper");
    const lastActive = TimestampsInHierarchy(
      rm_container,
      wrapper,
      "[last-active-timestamp]"
    )?.[0];
    const activeSel = ElementsPerBlock(
      closestBlock(lastActive),
      tmSel
    )?.[0];
    const targets2 = TimestampsInHierarchy(rm_container, wrapper, tmSel);
    return {
      query: {
        activeIdx: targets2.indexOf(activeSel),
        targets: targets2,
        includesPlayerOpt: options.includes("include_player")
      },
      wrapper
    };
  }
  async function newFunction(iframe) {
    if (!iframe)
      return {};
    const rm_container = closest_container_request(iframe);
    if (!rm_container)
      return {};
    return { rm_container };
  }
  async function TryToLoadNextTimestampSet(iframe, Reload) {
    await sleep(10);
    const o = await newFunction(iframe);
    if (!o.rm_container) {
      return Reload();
    }
    const { query, wrapper } = QueryTimestampObj(iframe, o.rm_container);
    const { message, target } = ReloadFlow(query);
    if (message == "reload-this") {
      return Reload();
    } else if (message == "update-timestamp") {
      return ClickResetWrapper(wrapper, { message });
    } else if (message == "seekTo-strict" && target) {
      return ClickOnTimestamp(target, { seekToMessage: message });
    } else {
      console.error("Unknown Reload Message", message);
    }
  }
  function TryToPlayEndSound() {
    const url2 = window.YT_GIF_DIRECT_SETTINGS.get("end_loop_sound_src")?.sessionValue;
    if (!isValidUrl(url2))
      return Promise.resolve();
    return new Promise(function(resolve, reject) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.volume = mapRange(
        Number(UI$1.range.end_loop_sound_volume.value),
        0,
        100,
        0,
        1
      );
      audio.autoplay = true;
      audio.onerror = reject;
      audio.onended = resolve;
      audio.src = url2;
    });
  }
  function ResetFullscreenPlayer() {
    exitFullscreen();
    setCurrentFullscreenPlayer("");
  }
  async function HandleEndState(Args) {
    Args.iframe.closest(".yt-gif-wrapper")?.dispatchEvent(new CustomEvent("customVideoEnded"));
    if (UI$1.timestamps.tm_loop_hierarchy.value != "disabled") {
      await TryToLoadNextTimestampSet(Args.iframe, Args.Reload);
    } else {
      await Args.Reload();
    }
    if (UI$1.range.end_loop_sound_volume.value != "0") {
      TryToPlayEndSound();
    }
    if (isSelected(UI$1.playerSettings.ps_options, "minimize_on_video_ended") && currentFullscreenPlayer === Args.id && document.fullscreenElement) {
      ResetFullscreenPlayer();
    }
  }
  window.AvoidCircularDependency.getOnStateChange = () => onStateChange;
  async function onStateChange(state) {
    const t = new YT_TargetWrapper(state.target);
    const id = t.GetIframeID();
    const map = allVideoParameters.get(id);
    const iframe = t.getIframe();
    if (!isRendered(iframe))
      return t.DestroyTarget();
    if (state.data === GetPlayerState().ENDED) {
      await HandleEndState({
        Reload: async () => TryReloadVideo({
          t,
          start: map?.start.value ?? 0,
          end: map?.end.value ?? 0
        }),
        iframe,
        id
      });
    }
    if (state.data === GetPlayerState().PLAYING && t.ytgif.timerID === null) {
      t.ytgif.enter();
    }
    if (state.data === GetPlayerState().PAUSED) {
      t.ytgif.ClearTimers();
    }
  }
  function playerConfig(configParams) {
    const {
      player_interface_language,
      player_captions_language,
      player_captions_on_load
    } = Object.fromEntries(window.YT_GIF_DIRECT_SETTINGS);
    const playerVars = {
      autoplay: 1,
      controls: 1,
      mute: 1,
      start: configParams?.start.value,
      end: configParams?.end.value,
      hl: configParams?.hl.value || player_interface_language.sessionValue,
      cc_lang_pref: configParams?.cc.value || player_captions_language.sessionValue,
      cc_load_policy: isTrue(player_captions_on_load.sessionValue) ? 1 : 3,
      iv_load_policy: 3,
      vq: "hd1080",
      autohide: 1,
      showinfo: 0,
      modestbranding: 1,
      fs: 1,
      rel: 0,
      version: 3,
      feature: "oembed",
      enablejsapi: 1,
      origin: "https://www.roamresearch.com"
    };
    return {
      height: "100%",
      width: "100%",
      videoId: configParams?.id.value,
      playerVars,
      events: {
        onReady: onPlayerReady,
        onStateChange
      }
    };
  }
  function getBlockID(wrapper) {
    if (!wrapper)
      return null;
    return closestYTGIFparentID(wrapper) + getWrapperUrlSufix(wrapper);
  }
  function getCurrentInputBlock() {
    return document.querySelector(
      ".rm-block__input--active.rm-block-text"
    );
  }
  async function getWrapperInHierarchyObj(pointOfReferenceElm) {
    let el = closestBlock(pointOfReferenceElm);
    const originalId = el?.id;
    while (el?.contains?.(pointOfReferenceElm)) {
      el = el.parentElement;
      if (classIs(el?.parentElement, "roam-app"))
        return GetFailObj();
      let wrapper = getWrapper();
      if (!wrapper) {
        if (!classIs(el, "roam-block-container")) {
          continue;
        }
      }
      while (isRendered(wrapper) && !wrapper?.hasAttribute("invalid-yt-gif") && classIs(wrapper, "rm-xparser-default-yt-gif")) {
        await sleep(10);
      }
      wrapper = getWrapper();
      const block = closestBlock(wrapper);
      const lastWrapper = ElementsPerBlock(block, ".yt-gif-wrapper").pop();
      if (lastWrapper)
        return {
          lastWrapper,
          container: el,
          block,
          id: block?.id,
          originalId,
          ok: true
        };
    }
    return GetFailObj();
    function classIs(x, cs) {
      return x ? x.classList.contains(cs) : false;
    }
    function hasSel(x, sel2) {
      return x ? x.querySelector(sel2) : null;
    }
    function GetFailObj() {
      return { ok: false };
    }
    function getWrapper() {
      return hasSel(el?.firstElementChild, ".yt-gif-wrapper") ?? hasSel(el?.firstElementChild, ".rm-xparser-default-yt-gif");
    }
  }
  function getMutationNodes(getCrrContainer, mutationsList, MutationObj) {
    let added = Array();
    let lastActive = Array();
    const rm_container = getCrrContainer();
    for (const record of mutationsList) {
      const t = record.target;
      if (t == rm_container || !underSameObs())
        continue;
      if (record.type == "attributes") {
        lastActive = [
          ...lastActive,
          ...NodesRecord$1(
            getCrrContainer,
            record.target,
            "last-active-timestamp",
            t
          )
        ];
        continue;
      }
      if (!record.target.hasAttribute("class"))
        continue;
      const { removedNodes, addedNodes } = record;
      MutationObj.removed = [
        ...MutationObj.removed,
        ...NodesRecord$1(
          getCrrContainer,
          removedNodes,
          "active-timestamp",
          t
        )
      ];
      added = [
        ...added,
        ...NodesRecord$1(
          getCrrContainer,
          addedNodes,
          "yt-gif-timestamp-emulation",
          t
        )
      ];
    }
    MutationObj.removed = validArr(MutationObj.removed);
    added = validArr(added);
    lastActive = validArr(lastActive);
    function validArr(arr) {
      return arr.flat(Infinity).filter((x) => !!x);
    }
    return { lastActive, added };
    function underSameObs() {
      const rmAt = (el, attr) => closest_attr(el, attr).found;
      return (el) => [
        rmAt(el, "yt-gif-block-uid"),
        rmAt(el, "yt-gif-anchor-container")
      ].some((v) => v == rm_container);
    }
  }
  function NodesRecord$1(getCrrContainer, Nodes, attr, target) {
    if (!Nodes || Nodes.length == 0)
      return [];
    const ElsArr = (Nodes instanceof NodeList ? Array.from(Nodes) : [Nodes]).map((nd) => nd).filter((el) => !!el.tagName);
    const _targetEl = target;
    const rm_container = getCrrContainer();
    const siblingIndex = (siblings, el) => Array.from(siblings).flat(Infinity).indexOf(el);
    const getChildren = (sel2) => rm_container.queryAllasArr(sel2);
    const getChildrenArr = (sel2, self) => !self ? getChildren(sel2) : [rm_container, ...getChildren(sel2)];
    function timestampObj2(page, arr) {
      return getTmpObj(
        arr.find((x) => x.getAttribute("timestamp-style") == page),
        page,
        arr
      );
    }
    function lastTimestampObj(el, arr) {
      return getTmpObj(
        el,
        el.getAttribute("timestamp-style"),
        arr
      );
    }
    function getTmpObj(el, page, arr) {
      return {
        el,
        timestamp: el?.getAttribute("timestamp"),
        index: arr.indexOf(el),
        page,
        otherPage: page == "start" ? "end" : "start"
      };
    }
    return ElsArr.map((x) => {
      if (x.hasAttribute(attr))
        return x;
      else
        return x.queryAllasArr(`[${attr}]`);
    }).flat(Infinity).map((el) => closestBlock(el)).filter((v, i, a) => !!v && a.indexOf(v) === i).map((block) => {
      block = block;
      const allTimestamps = ElementsPerBlock(block, "[yt-gif-timestamp-emulation]") || [];
      const activeTimestamps = allTimestamps.filter((x) => x.hasAttribute(attr)) || [];
      const lastActiveEl = activeTimestamps.find((x) => x.hasAttribute("last-active-timestamp") || x.hasAttribute(attr));
      return {
        blockID: block.id,
        blockIndex: siblingIndex(
          getChildrenArr(".rm-block__input"),
          block
        ),
        containerIndex: siblingIndex(
          getChildrenArr(".roam-block-container", true),
          rm_container
        ),
        workflow: "strict",
        node: _targetEl.querySelector("[yt-gif-timestamp-emulation]"),
        start: timestampObj2("start", activeTimestamps),
        end: timestampObj2("end", activeTimestamps),
        target: lastTimestampObj(lastActiveEl, activeTimestamps)
      };
    });
  }
  async function TryToReset(getTargetWrapper, MutationObj) {
    const removedActiveObj = MutationObj.removed.find(
      (rO) => rO?.target?.timestamp && canReset(rO.blockID)
    );
    const activeMatch = !!removedActiveObj && UI$1.timestamps.tm_reset_on_removal.value != "disabled";
    if (activeMatch) {
      MutationObj.removed.length = 0;
      await ClickResetWrapper(getTargetWrapper());
    }
    return activeMatch;
    function canReset(id) {
      if ("block" == UI$1.timestamps.tm_reset_on_removal.value) {
        id = assertSelector(id);
        if (!document.querySelector("div.rm-block__input#" + id))
          return true;
      } else if ("container" == UI$1.timestamps.tm_reset_on_removal.value) {
        if (!document.getElementById(id))
          return true;
      }
    }
  }
  async function TryToRestore({ getObsTimestamp, delObsTimestmp, getCrrContainer }, added) {
    const commonObj = added.find((a) => OkObservedTimestamp(getObsTimestamp, a));
    const restoreMath = !!commonObj && UI$1.timestamps.tm_recovery.checked;
    if (!restoreMath) {
      return false;
    }
    const block = document.getElementById(commonObj.blockID);
    if (AnyInvalidRawTimestamp(block)) {
      return true;
    }
    const equals = GetEquals(getObsTimestamp, block);
    if (UI$1.timestamps.tm_restore.value == "match" && !equals()) {
      delObsTimestmp();
      return true;
    }
    await TryToRecoverActiveTimestamp(
      getCrrContainer,
      getObsTimestamp(),
      { simMessage: equals() ? "visuals" : "" }
    );
    return true;
  }
  function GetEquals(getObsTimestamp, block) {
    const get = (k) => getObsTimestamp()?.target[k];
    return (k = "timestamp") => get(k)?.toString() == ElementsPerBlock(block, `[${k}]`)?.[Number(get("index"))]?.getAttribute?.(k);
  }
  function AnyInvalidRawTimestamp(block) {
    const rawComponents = ElementsPerBlock(
      block,
      ".rm-xparser-default-start, .rm-xparser-default-end"
    );
    const rendered = rawComponents.length > 0;
    return rendered;
  }
  function OkObservedTimestamp(getObsTimestamp, aO) {
    return !!aO.blockID && aO.blockID == getObsTimestamp()?.blockID;
  }
  function CleanupGarbage(added, MutationObj) {
    if (!UI$1.timestamps.tm_recovery.checked || added.length > 0 || MutationObj.removed.length > 0) {
      return;
    }
    const inactiveYetAdded = MutationObj.removed.find(
      (r) => OkTimestamp(r) && added.some((a) => OkTimestamp(a) && SameBlockID(a, r))
    );
    if (inactiveYetAdded) {
      const start = MutationObj.removed.indexOf(inactiveYetAdded);
      MutationObj.removed.splice(start, 1);
    }
  }
  function OkTimestamp(o) {
    return o.target.timestamp;
  }
  function SameBlockID(a, r) {
    return a.blockID.includes(r.blockID);
  }
  async function TryToRecoverTimestamps(that, mutationsList, MutationObj) {
    const { lastActive, added } = getMutationNodes(
      that.getCrrContainer,
      mutationsList,
      MutationObj
    );
    TryToSetLastActiveTimestamp(that.setObsTimestamp, lastActive);
    if (await TryToReset(that.getTargetWrapper, MutationObj)) {
      return;
    }
    if (await TryToRestore(that, added)) {
      return;
    }
    CleanupGarbage(added, MutationObj);
  }
  function TrySetUpTimestampRecovery(that, rm_container) {
    if (!rm_container || rm_container?.hasAttribute("timestamp-observer")) {
      return {
        getCrrContainer: () => rm_container,
        switchTimestampObsOnAchor: (e) => {
        }
      };
    }
    const { delObsTimestmp, getTargetWrapper, getObsTimestamp } = that;
    rm_container.setAttribute("timestamp-observer", "");
    rm_container.addEventListener("customDelObsTimestmp", delObsTimestmp);
    const arr = [getObsTimestamp()];
    const MutationObj = { removed: arr, lastActive: arr };
    let awaiting = false;
    const observer = new MutationObserver(async (mutationsList) => {
      if (awaiting || !UI$1.display.simulate_roam_research_timestamps.checked)
        return;
      awaiting = true;
      await TryToRecoverTimestamps(that, mutationsList, MutationObj);
      awaiting = false;
    });
    const config = { attributes: true, childList: true, subtree: true };
    const anchor_opt = getOption(UI$1.timestamps.tm_options, "anchor");
    const target = getTarget2Observer(anchor_opt.selected);
    let getCrrContainer = () => target;
    observer.observe(target, config);
    const switchTimestampObsOnAchor = (e) => {
      const bol2 = e.target.selected;
      DeactivateTimestampsInHierarchy(
        getTarget2Observer(true),
        getTargetWrapper()
      );
      getTarget2Observer(!bol2)?.removeEventListener(
        "customDelObsTimestmp",
        delObsTimestmp
      );
      observer.disconnect();
      const target2 = getTarget2Observer(bol2);
      target2.addEventListener("customDelObsTimestmp", delObsTimestmp);
      observer.observe(target2, config);
      getCrrContainer = () => target2;
    };
    anchor_opt.addEventListener("customChange", switchTimestampObsOnAchor);
    function getTarget2Observer(bol2) {
      return !bol2 ? rm_container : closest_anchor_container(rm_container) ?? rm_container;
    }
    return {
      getCrrContainer,
      switchTimestampObsOnAchor
    };
  }
  function TimestampRecovery(o) {
    const { rm_container, grandParentBlock: grandParentBlock2, blockID } = o;
    const that = {
      getCrrContainer: () => rm_container,
      getTargetWrapper: () => {
        const block = document.getElementById(grandParentBlock2.id) ?? grandParentBlock2;
        if (!block)
          return null;
        return block.queryAllasArr(".yt-gif-wrapper")?.pop() ?? null;
      },
      getLocalBlockID: () => {
        return getBlockID(that.getTargetWrapper()) ?? blockID;
      },
      getObsTimestamp: () => {
        const lastActive = observedParameters.get(
          that.getLocalBlockID()
        )?.lastActiveTimestamp;
        if (lastActive && UI$1.timestamps.tm_recovery.checked) {
          return lastActive;
        }
        return null;
      },
      delObsTimestmp: () => {
        observedParameters.delete(that.getLocalBlockID());
      },
      setObsTimestamp: (commonObj) => {
        if (!commonObj || !commonObj.blockID)
          return;
        const blockID2 = that.getLocalBlockID();
        const lastActive = observedParameters.get(blockID2)?.lastActiveTimestamp;
        const equals = commonObj.target?.timestamp === lastActive?.target?.timestamp;
        const ok = commonObj.target?.timestamp;
        if (ok && (!equals || !lastActive))
          observedParameters.set(blockID2, {
            lastActiveTimestamp: commonObj
          });
      },
      switchTimestampObsOnAchor: (e) => {
      }
    };
    return {
      ...that,
      ...TrySetUpTimestampRecovery(that, rm_container)
    };
  }
  function SetupTimestampObserver(grandParentBlock2, uid) {
    const rm_container = closest_container(grandParentBlock2);
    rm_container?.setAttribute("yt-gif-block-uid", uid);
    return rm_container;
  }
  function GetNewID() {
    return iframeIDprfx + Number(++window.YT_GIF_OBSERVERS.creationCounter);
  }
  function CreateRecordID(o) {
    const record = new T_YT_RECORD();
    sessionIDs.uid = o.uid;
    const blockID = o.grandParentBlock.id + properBlockIDSufix(o.url, o.accUrlIndex);
    if (blockID != null)
      recordedIDs.set(blockID, record);
    return { blockID, record };
  }
  function CreateConfigParams(newId, url2) {
    allVideoParameters.set(newId, ExtractParamsFromUrl(url2));
    const configParams = allVideoParameters.get(newId);
    return configParams;
  }
  function CheckFalsePositive(o) {
    if (!o.url || o.accUrlIndex < 0 || !o.uid) {
      UIDtoURLInstancesMapMap.delete(o.uid);
      o.wrapper.setAttribute("invalid-yt-gif", "");
      console.log(
        `YT GIF: Couldn't find yt-gif component number ${o.accUrlIndex + 1} within the block ((${o.uid}))`
      );
      return true;
    }
    return false;
  }
  function CreateYTGIFElement(o) {
    let wrapper = o.wrapper;
    if (wrapper.tagName != "DIV") {
      wrapper = ChangeElementType(wrapper, "div");
    }
    wrapper.parentElement?.classList.add(`${cssData.yt_gif_wrapper}-parent`);
    wrapper.className = `${cssData.yt_gif_wrapper} dont-focus-block`;
    if (o.customSpan) {
      wrapper.style.setProperty(
        "--yt-gif-player-span",
        parseFloat(o.customSpan) + "%"
      );
    }
    wrapper.setAttribute(attrInfo.target, o.targetClass);
    wrapper.setAttribute(attrInfo.creation.name, o.dataCreation);
    wrapper.setAttribute(attrInfo.url.path, o.url);
    wrapper.setAttribute(attrInfo.url.index, o.accUrlIndex.toString());
    wrapper.innerHTML = "";
    wrapper.insertAdjacentHTML("afterbegin", links.html.fetched.playerControls);
    wrapper.querySelector(".yt-gif-player").id = o.newId;
    return wrapper;
  }
  function AsyncDeployment(dataCreation) {
    return dataCreation == attrInfo.creation.forceAwaiting || isInput_selectedValid();
  }
  function RemovedFromDom(o) {
    const rm_container = o.that.getCrrContainer();
    UIDtoURLInstancesMapMap.delete(o.uid);
    if (!o.deployed()) {
      recordedIDs.delete(o.blockID);
      allVideoParameters.delete(o.newId);
    }
    if (!UI$1.timestamps.tm_recovery.checked) {
      DeactivateTimestampsInHierarchy(rm_container, o.wrapper);
    }
    if (!isRendered(rm_container) && rm_container?.closest(".rm-sidebar-outline")) {
      o.that.delObsTimestmp();
    }
    if (!isRendered(rm_container)) {
      getOption(UI$1.timestamps.tm_options, "anchor").removeEventListener(
        "customChange",
        o.that.switchTimestampObsOnAchor
      );
    }
  }
  async function onYouTubePlayerAPIReady(params) {
    let { wrapper } = params;
    if (!wrapper || !wrapper.parentNode)
      return null;
    let deployed = false;
    const uidResult = await URLResults(wrapper);
    const { url: url2, uid, grandParentBlock: grandParentBlock2 } = uidResult;
    if (CheckFalsePositive({ ...uidResult, wrapper }))
      return null;
    const newId = GetNewID();
    const configParams = CreateConfigParams(newId, url2);
    const { blockID, record } = CreateRecordID(uidResult);
    wrapper = CreateYTGIFElement({
      ...params,
      ...uidResult,
      customSpan: configParams.sp.value,
      newId
    });
    const rm_container = SetupTimestampObserver(grandParentBlock2, uid);
    const base2 = { rm_container, grandParentBlock: grandParentBlock2, blockID };
    const that = TimestampRecovery(base2);
    const instance = { wrapper, ...base2, ...uidResult };
    tryToInsertControls(instance, record);
    RemovedElementObserver({
      el: grandParentBlock2?.querySelector("span"),
      OnRemovedFromDom_cb: () => RemovedFromDom({
        ...instance,
        deployed: () => deployed,
        that,
        blockID,
        newId
      })
    });
    if (AsyncDeployment(params.dataCreation)) {
      DeployAsync(that, {
        wrapper,
        url: url2,
        configParams,
        deploy: deploy2
      });
    } else {
      await AssertParamsClickTimestamp(that, configParams);
      deploy2();
    }
    return wrapper;
    function deploy2() {
      deployed = true;
      record.wTarget = new window.YT.Player(newId, playerConfig(configParams));
    }
  }
  function Local$3(targetClass) {
    return {
      async OnRendered(wrapper) {
        window.YT_GIF_OBSERVERS.masterIntersectionObservers.push(
          PlayerOnIntersection({
            wrapper,
            message: "valid entries MutationObserver",
            targetClass
          })
        );
      },
      validTemplates() {
        return document.queryAllasArr("." + targetClass).filter((el) => isNotZoomPath(el));
      }
    };
  }
  function DeployPlayer({ wrapper, targetClass, message }) {
    onYouTubePlayerAPIReady({
      wrapper,
      targetClass,
      dataCreation: wrapper.getAttribute(attrInfo.creation.name),
      message: message || "YScrollerObserver"
    });
  }
  function PlayerOnIntersection(input) {
    const yobs = new IntersectionObserver(
      (entries) => {
        if (!entries[0])
          yobs.disconnect();
        for (const entry of entries)
          if (entry.isIntersecting) {
            DeployPlayer(input);
            yobs.disconnect();
            break;
          }
      },
      {
        threshold: [0]
      }
    );
    yobs.observe(input.wrapper);
    return yobs;
  }
  function ObserveIframesAndDelployYTPlayers(targetClass) {
    const local = Local$3(targetClass);
    inViewportElsHard(local.validTemplates()).forEach(
      (wrapper) => DeployPlayer({ wrapper, message: "first wave", targetClass })
    );
    local.validTemplates().forEach(
      (wrapper) => window.YT_GIF_OBSERVERS.masterIntersectionObservers.push(
        PlayerOnIntersection({
          wrapper,
          message: "second wave",
          targetClass
        })
      )
    );
    const observer = new MutationObserver(
      async (mutations) => Mutation_cb_raw_rm_cmpts(mutations, targetClass, local.OnRendered)
    );
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }
  function pushMasterObserverWithTargetClass(classToObserve) {
    window.YT_GIF_OBSERVERS.masterMutationObservers.push(
      ObserveIframesAndDelployYTPlayers(classToObserve)
    );
  }
  const deploy = {
    deploymentStyle: function() {
      return this.BinaryDomUI().checked;
    },
    checkSubDeploymentStyle: function(bol2) {
      this.BinaryDomUI().checked = bol2;
    }
  };
  const base = {
    ...deploy,
    runMasterObservers: function() {
      pushMasterObserverWithTargetClass(this.classToObserve);
    }
  };
  const rm_base = {
    video: {
      description: "{{[[video]]}}",
      classToObserve: "rm-video-player__spacing-wrapper"
    },
    yt_gif: {
      description: "{{[[yt-gif]]}}",
      classToObserve: `rm-xparser-default-${cssData.yt_gif}`
    }
  };
  const targets = {
    video: {
      ...base,
      ...rm_base.video,
      page: "video",
      BinaryDomUI: () => UI$1.deploymentStyle.deployment_style_video
    },
    yt_gif: {
      ...base,
      ...rm_base.yt_gif,
      page: "yt-gif",
      BinaryDomUI: () => UI$1.deploymentStyle.deployment_style_yt_gif
    },
    both: {
      ...deploy,
      description: `${rm_base.video.description} and ${rm_base.yt_gif.description}`,
      classToObserve: null,
      classesToObserve: [
        rm_base.video.classToObserve,
        rm_base.yt_gif.classToObserve
      ],
      BinaryDomUI: () => UI$1.deploymentStyle.deployment_style_both,
      runMasterObservers: function() {
        this.classesToObserve.forEach(
          (c) => pushMasterObserverWithTargetClass(c)
        );
      }
    },
    yt_gif_tut: {
      classToObserve: "yt-gif-ddm-tutorial"
    }
  };
  function GetDeployStateDriver(target = targets) {
    const state = {
      currentKey: "yt_gif",
      initialKey: "",
      currentClassesToObserver: Array()
    };
    return {
      state,
      checkSubDeploymentStyle(key, bol2) {
        target[key].checkSubDeploymentStyle(bol2);
      },
      RunMasterObserverWithKey(key) {
        state.currentKey = key;
        target[key].runMasterObservers();
      },
      assertCurrentKey(overrideKey) {
        const newKey = getNewKey(overrideKey);
        state.currentClassesToObserver = getClassesToObserve(newKey);
        YTGIF_Config.componentPage = getComponentPage(newKey);
        return state.currentKey = newKey;
      },
      ChargeMasterObserversWithValidDeploymentStyle() {
        const valid = ObjectKeys(target).filter((k) => target[k].hasOwnProperty("deploymentStyle"));
        valid.some((key) => {
          if (isTrue(target[key].deploymentStyle())) {
            this.RunMasterObserverWithKey(key);
            return true;
          }
        });
      }
    };
    function getNewKey(overrideKey) {
      let newKey = "yt_gif";
      if (isTrue(overrideKey)) {
        newKey = "video";
      } else if (overrideKey === "both") {
        newKey = "both";
      }
      return newKey;
    }
    function getComponentPage(newKey) {
      return newKey == "both" ? "yt-gif|video" : target[newKey].page;
    }
    function getClassesToObserve(newKey) {
      return newKey == "both" ? target[newKey].classesToObserve : [target[newKey].classToObserve];
    }
  }
  const rm_components = GetDeployStateDriver();
  window.AvoidCircularDependency.getCurrentClassesToObserver = function() {
    return rm_components.state.currentClassesToObserver;
  };
  async function updateSettingsPageBlock(input, keyObj, siblingKeys) {
    const { type, checked, value } = input;
    let replaceWith = value.toString();
    if (type == "checkbox" || type == "radio") {
      replaceWith = checked.toString();
    }
    if (type == "radio") {
      [...siblingKeys].map((x) => window.YT_GIF_DIRECT_SETTINGS.get(x)).filter((y) => y.inputType == "radio").forEach((o) => o.UpdateSettingsBlockValue(""));
    }
    if (type == "select-multiple") {
      replaceWith = Array.from(input.selectedOptions).map((o) => o.value).toString();
    }
    await window.YT_GIF_DIRECT_SETTINGS.get(keyObj)?.UpdateSettingsBlockValue?.(
      replaceWith.toString()
    );
  }
  async function updateOverrideComponentSettingBlock(el) {
    const validOverride = validOverrideComponentSettingBlock(el);
    if (validOverride) {
      rm_components.assertCurrentKey(validOverride);
      await window.YT_GIF_DIRECT_SETTINGS.get(
        "override_roam_video_component"
      )?.UpdateSettingsBlockValue(validOverride);
    }
  }
  function validOverrideComponentSettingBlock(el) {
    const idPrfx = (key) => `deployment_style_${key}`;
    let replaceWith = null;
    switch (el.id) {
      case idPrfx("yt_gif"):
        replaceWith = "false";
        break;
      case idPrfx("video"):
        replaceWith = "true";
        break;
      case idPrfx("both"):
        replaceWith = "both";
        break;
    }
    return replaceWith;
  }
  function SaveSettingsOnChanges() {
    for (const parentKey of ObjectKeys(UI$1)) {
      let siblingKeys = Array();
      const parentObj = UI$1[parentKey];
      for (const childKey of ObjectKeys(parentObj)) {
        const child = parentObj[childKey];
        siblingKeys = pushSame(siblingKeys, childKey);
        switch (parentKey) {
          case "defaultPlayerValues":
          case "defaultValues":
            continue;
          case "deploymentStyle":
            child.addEventListener(
              "change",
              async function(e) {
                await updateOverrideComponentSettingBlock(
                  e.target
                );
              },
              true
            );
            continue;
          case "range":
            child.addEventListener(
              "wheel",
              function() {
                child.dispatchEvent(new Event("change"));
              },
              true
            );
        }
        async function HandleSettingsPageBlockUpdate(e) {
          return updateSettingsPageBlock(
            e.currentTarget,
            childKey,
            siblingKeys
          );
        }
        if (!child?.addEventListener) {
          console.log("yt-gif debugger");
          continue;
        }
        child.addEventListener(
          "change",
          HandleSettingsPageBlockUpdate,
          true
        );
        child.addEventListener(
          "customChange",
          HandleSettingsPageBlockUpdate,
          true
        );
      }
    }
  }
  class CustomSelect {
    constructor(_args) {
      __publicField(this, "classes");
      __publicField(this, "fakeSel");
      __publicField(this, "customSelect");
      this.fakeSel = _args.fakeSel;
      this.classes = _args.classes || { selected: "selected" };
      this.customSelect = document.createElement("select");
      if (this.fakeSel.hasAttribute("multiple"))
        this.customSelect.setAttribute("multiple", "");
      this._removeFakeSibling();
      for (const fake of this._getArrayChildrenOptions()) {
        const option = document.createElement("option");
        option.setAttribute("value", fake.getAttribute("value"));
        option.textContent = fake.textContent;
        this.customSelect.appendChild(option);
        if (fake.hasAttribute("selected"))
          this._select(fake);
        const handleSelect = () => {
          if (fake.hasAttribute("disabled") || option.disabled)
            return;
          const previous = option.selected;
          if (this.fakeSel.hasAttribute("multiple") && (fake.hasAttribute("selected") || option.selected)) {
            this._deselect(fake);
            this._fireCustomChange(option, false, previous);
          } else {
            this._select(fake);
            this._fireCustomChange(option, true, previous);
          }
          this.customSelect.dispatchEvent(new Event("change"));
        };
        const customSelect = (bol2) => {
          if (bol2)
            this._select(fake);
          else
            this._deselect(fake);
          this.customSelect.dispatchEvent(new Event("customBind"));
        };
        fake.addEventListener("click", handleSelect.bind(this));
        option.customSelect = customSelect.bind(this);
        option.customHandleSelect = handleSelect.bind(this);
        option.fake = fake;
      }
      this.fakeSel.insertAdjacentElement("afterend", this.customSelect);
      this.customSelect.style.display = "none";
      this.customSelect.setAttribute("hidden-fake-select", "");
    }
    _output() {
      return {
        select: this.customSelect,
        originalSelect: this.fakeSel
      };
    }
    _removeFakeSibling() {
      if (this.fakeSel.nextElementSibling?.hasAttribute("hidden-fake-select"))
        this.fakeSel.parentNode?.removeChild(
          this.fakeSel.nextElementSibling
        );
    }
    _getArrayChildrenOptions() {
      return Array.from(this.fakeSel.children);
    }
    _select(fake) {
      if (!this.fakeSel.hasAttribute("multiple"))
        this._getArrayChildrenOptions().forEach(
          (el) => this._vsSelected(false, el)
        );
      this._isSelected(true, fake);
      this._vsSelected(true, fake);
    }
    _deselect(fake) {
      this._isSelected(false, fake);
      this._vsSelected(false, fake);
    }
    _vsSelected(bol2, el) {
      toggleAttribute(bol2, "selected", el);
      if (this.classes.selected)
        toggleClasses(bol2, [this.classes.selected], el);
    }
    _isSelected(bol2, fake) {
      const index = this._getArrayChildrenOptions().indexOf(fake);
      const option = this.customSelect.children[index];
      option.selected = bol2;
    }
    _fireCustomChange(option, bol2, previousValue = false) {
      if (previousValue != bol2)
        option.dispatchEvent(
          new CustomEvent("customChange", {
            bubbles: false,
            cancelBubble: true,
            cancelable: true,
            detail: {
              previousValue,
              currentValue: bol2
            }
          })
        );
    }
  }
  function DDM_to_UI_variables() {
    document.queryAllasArr(".select").forEach((fakeSel) => {
      if (!fakeSel)
        return;
      const { select, originalSelect } = new CustomSelect({
        fakeSel
      })._output();
      const attrs = Array.from(originalSelect.attributes).map((a) => ({
        name: a.name,
        value: a.value
      }));
      const ignore = ["class", "multiple"];
      for (const { name, value } of attrs) {
        if (ignore.includes(name))
          continue;
        select.setAttribute(name, value);
        originalSelect.removeAttribute(name);
      }
    });
    for (const parentKey of ObjectKeys(UI$1)) {
      const parentObj = UI$1[parentKey];
      if (parentObj.baseKey?.inputType == "prompt") {
        delete UI$1[parentKey];
        continue;
      }
      for (const childKey of ObjectKeys(parentObj)) {
        const child = parentObj[childKey];
        const directObjPpts = child?.baseKey ? child.baseKey : child;
        const sessionValue = directObjPpts.sessionValue;
        const getEl = () => document.getElementById(childKey);
        const domEl = getEl();
        if (domEl) {
          parentObj[childKey] = domEl;
          const input = getEl();
          switch (parentKey) {
            case "range":
              input.value = sessionValue;
              break;
            case "label":
              domEl.textContent = sessionValue;
              break;
            default:
              if (domEl.tagName == "SELECT") {
                const sesionOptions = sessionValue.toString().split(",").filter((s) => !!s);
                const selc = getEl();
                Array.from(selc.options).forEach((o) => {
                  const selected = sesionOptions.includes(o.value);
                  o.selected = selected;
                  if (selected && selc.type == "select-one")
                    selc.value = o.value;
                  o["customSelect"]?.(o.selected);
                });
              } else {
                input.checked = isTrue(sessionValue);
              }
              domEl.previousElementSibling?.setAttribute(
                "for",
                childKey
              );
          }
        } else {
          if (directObjPpts.hasOwnProperty("baseValue")) {
            parentObj[childKey] = sessionValue || directObjPpts.baseValue;
          } else if (childKey == "baseKey" || directObjPpts.inputType == "prompt") {
            delete parentObj[childKey];
          }
        }
      }
    }
  }
  function togglePlayPauseStyles() {
    const mute = UI$1.playerSettings.mute_style;
    const play = UI$1.playerSettings.play_style;
    const ilogicSoftStyle = () => mute.value == "soft" && play.value == "soft";
    const playState = () => getOption(play, "soft").disabled = ilogicSoftStyle();
    playState();
    mute.addEventListener("change", playState);
    play.addEventListener("change", playState);
  }
  function initialize_modes_synergy(slider = UI$1.range.iframe_buffer_slider, input_x_buffer = getOption(UI$1.experience.initialize_mode, "input_x_buffer"), initialize_mode = UI$1.experience.initialize_mode) {
    initialize_mode.addEventListener(
      "change",
      () => input_x_buffer.disabled = false
    );
    input_x_buffer.addEventListener("customChange", ifBuffer_ShiftOldest);
    slider.addEventListener("click", ifBuffer_ShiftOldest);
    slider.addEventListener("wheel", ifBuffer_ShiftOldest);
  }
  function getIconFlipObj(el) {
    const falseVal = Array.from(el.classList)?.reverse().find((c) => c.includes("bp3-icon-"));
    const trueVal = "bp3-icon-" + el.getAttribute("flip-icon");
    return { falseVal, trueVal, el };
  }
  function getTooltipFlipObj(el) {
    const trueVal = el.getAttribute("flip-tooltip");
    const falseVal = el.getAttribute("data-tooltip");
    return { falseVal, trueVal, el };
  }
  function ToggleIcons(bol2, { falseVal, trueVal, el }) {
    bol2 = isTrue(bol2);
    toggleClasses(false, [trueVal, falseVal], el);
    toggleClasses(true, [bol2 ? trueVal : falseVal], el);
    return bol2;
  }
  function ToggleTooltips(bol2, { falseVal, trueVal, el }) {
    bol2 = isTrue(bol2);
    toggleAttribute(true, "data-tooltip", el, bol2 ? trueVal : falseVal);
    return bol2;
  }
  function ListenFor(focus, message, el) {
    message.addEventListener("click", () => focus.Gain(message, el));
    message.addEventListener("blur", () => focus.Lost(el));
  }
  function GetWholeEls(ddm_info_message_selector) {
    const infoMessages = document.queryAllasArr(ddm_info_message_selector);
    const validFocusMessage = /* @__PURE__ */ new Map();
    for (const i of infoMessages) {
      const possibleSubDdm = i.nextElementSibling;
      if (possibleSubDdm?.classList.contains("dropdown-content")) {
        spanNegativeTabIndex(i);
        validFocusMessage.set(i, possibleSubDdm);
      }
    }
    return validFocusMessage;
  }
  function Focus(classNames) {
    function Gain(el, targetEl) {
      el.focus();
      toggleClasses(true, classNames, targetEl);
    }
    function Lost(targetEl) {
      toggleClasses(false, classNames, targetEl);
    }
    return { Gain, Lost };
  }
  function GetMainYTGIFicon({ ddm_icon } = cssData) {
    const mainMenu = document.querySelector("span.yt-gif-drop-down-menu-toolbar .dropdown");
    const mainDDM = document.querySelector(
      "span.yt-gif-drop-down-menu-toolbar .dropdown > .dropdown-content"
    );
    const icon = document.querySelector("." + ddm_icon);
    spanNegativeTabIndex(icon);
    return { icon, mainDDM, mainMenu };
  }
  function spanNegativeTabIndex(el) {
    if (el.tagName)
      el.setAttribute("tabindex", "-1");
  }
  async function navigateToSettingsPageInSidebar() {
    const anySidebarInstance = () => Bars().length >= 1;
    const { tooltip, icon } = GetTooltips();
    const visuals = (bol2) => {
      ToggleTooltips(bol2, tooltip);
      ToggleIcons(bol2, icon);
    };
    const switchSidebar = () => visuals(anySidebarInstance());
    tooltip.el.addEventListener("click", async function() {
      await setSideBarState(3);
      await sleep(50);
      if (!anySidebarInstance()) {
        visuals(true);
        await openBlockInSidebar(TARGET_UID);
      }
      await sleep(50);
      Bars()?.[0]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    });
    tooltip.el.addEventListener("mouseenter", switchSidebar);
    const { icon: Icon } = GetMainYTGIFicon();
    Icon.addEventListener("blur", switchSidebar, true);
    Icon.addEventListener("mouseenter", switchSidebar, true);
    Icon.addEventListener("mouseleave", switchSidebar, true);
  }
  function GetTooltips() {
    const wrapper = document.querySelector("#navigate-to-yt-gif-settings-page");
    const tooltip = getTooltipFlipObj(wrapper.querySelector(`[data-tooltip]`));
    const icon = getIconFlipObj(wrapper.querySelector(`input`));
    return { tooltip, icon };
  }
  function Bars() {
    return innerElsContains(
      ".rm-sidebar-outline .rm-title-display span",
      TARGET_PAGE
    );
  }
  async function smart_LoadCSS(cssURL, id) {
    if (!await isValidFetch(cssURL)) {
      return;
    }
    return new Promise(function(resolve, reject) {
      DeleteDOM_Els(id, cssURL);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = NoCash(cssURL);
      link.id = id;
      document.head.appendChild(link);
      link.onload = () => resolve();
    });
  }
  function DeleteDOM_Els(id, cssURL) {
    const stylesAlready = document.queryAllasArr(`[id='${id}']`);
    if (stylesAlready?.length > 0) {
      SytleSheetExistAlready(cssURL);
      for (const el of stylesAlready) {
        el.parentElement?.removeChild(el);
      }
    }
  }
  function SytleSheetExistAlready(id) {
    console.log(`The stylesheet ${id} already exist.`);
  }
  function smart_CssPlayer_UCS(player_span) {
    if (isValidCSSUnit(player_span)) {
      document.documentElement.style.setProperty(
        "--yt-gif-player-span",
        player_span
      );
    }
  }
  async function smart_Load_DDM_onTopbar(dropDownMenu) {
    const rm_moreIcon = document.querySelector(".bp3-icon-more")?.closest(".rm-topbar .rm-topbar__spacer-sm + .bp3-popover-wrapper");
    const htmlText = window.YT_GIF_OBSERVERS.dmm_html ?? await FetchText(dropDownMenu);
    const previousList = DDM_Els();
    if (previousList?.length > 0) {
      for (const el of previousList) {
        el.parentElement?.removeChild(el);
      }
      RemoveElsEventListeners(previousList);
    }
    rm_moreIcon?.insertAdjacentHTML("afterend", htmlText);
  }
  function DDM_Els() {
    const { ddm_exist } = cssData;
    return document.queryAllasArr("." + ddm_exist);
  }
  function ToggleTheme(Switch = UI$1.dropdownMenu.ddm_css_theme_input, themes = links.css.themes, ddm_css_theme_stt = window.YT_GIF_DIRECT_SETTINGS.get(
    "ddm_css_theme_input"
  ), ddm_main_theme_id = cssData.id.ddm_main_theme) {
    const icons = ["bp3-icon-flash", "bp3-icon-moon"];
    flip(Switch);
    Switch.addEventListener("change", flip.bind(null, Switch));
    async function flip(tEl) {
      const previousIcons = Array.from(tEl?.classList)?.filter(
        (el) => el.startsWith("bp3-icon-")
      );
      toggleClasses(false, previousIcons, tEl);
      toggleClasses(true, [!tEl.checked ? icons[0] : icons[1]], tEl);
      await smart_LoadCSS(
        themes.toogle(isTrue(ddm_css_theme_stt.sessionValue)),
        ddm_main_theme_id
      );
    }
  }
  function FlipBindAttr(toggleClasses2 = [cssData.dropdown__hidden], _attrData = attrData) {
    for (const key in _attrData) {
      const { check, select, main } = Toggle(key, toggleClasses2);
      if (!main) {
        console.log("yt-gif debugger");
        continue;
      }
      if (main.tagName == "INPUT") {
        ListenToChange(main, check);
      } else if (main.tagName == "SELECT") {
        ListenToChange(main, select);
      }
    }
  }
  function ListenToChange(target, OnCb) {
    OnCb();
    target.addEventListener("change", OnCb);
    target.addEventListener("customBind", OnCb);
  }
  function Toggle(key, classes) {
    const main = document.querySelector(`[data-main='${key}']`);
    const binds = () => document.queryAllasArr(`[data-bind*='${key}']`);
    const check = () => binds().forEach((b) => toggleClasses(!main.checked, classes, b));
    const select = () => binds().forEach((b) => {
      const { on, not } = GetFlipAttr(b);
      const { equals, any } = GetComparison(main);
      if (on) {
        toggleClasses(!(equals(on) || any(on)), classes, b);
      } else if (not) {
        toggleClasses(equals(not) || any(not), classes, b);
      }
    });
    return { check, select, main };
  }
  function GetFlipAttr(b) {
    const on = b.getAttribute("on");
    const not = b.getAttribute("not");
    return { on, not };
  }
  function GetComparison(main) {
    const selOpts = main.type == "select-multiple" ? [...main.selectedOptions].map((o) => o.value) : [main.value];
    const is = (v) => selOpts.includes(v);
    const equals = (s) => s.split(",").map((s2) => s2.trim()).some((v) => is(v));
    const any = (v) => !is("disabled") && v == "any";
    return { equals, any };
  }
  function ToggleThumbnails(thumbnail_as_bg, { awaitng_player_user_input } = cssData) {
    thumbnail_as_bg.addEventListener("customChange", function(e) {
      document.queryAllasArr(`.${awaitng_player_user_input}`).forEach((el) => {
        if (e.target.selected)
          applyIMGbg(el, el.getAttribute("data-video-url"));
        else
          removeIMGbg(el);
      });
    });
  }
  function UpdateOnScroll_RTM(scroll) {
    const labelEl = scroll.nextElementSibling;
    labelEl.textContent = scroll.value;
    scroll.addEventListener(
      "click",
      (e) => UptLabel(e.currentTarget),
      true
    );
    scroll.addEventListener("wheel", (e) => UptLabel(SliderValue(e)), true);
    function SliderValue(e) {
      const elScroll = e.currentTarget;
      const dir = Math.sign(e.deltaY) * -1;
      const parsed = parseInt(elScroll.value, 10);
      elScroll.value = Number(dir + parsed).toString();
      return elScroll;
    }
    function UptLabel(elScroll) {
      labelEl.textContent = elScroll.value;
      elScroll.dispatchEvent(new Event("change"));
    }
  }
  function DDMHover({ ddm_focus, ddm_info_message_selector } = cssData) {
    const { icon, mainDDM } = GetMainYTGIFicon();
    const focus = Focus([ddm_focus]);
    ListenFor(focus, icon, mainDDM);
    [...GetWholeEls(ddm_info_message_selector).entries()].forEach(
      ([message, el]) => ListenFor(focus, message, el)
    );
  }
  function FocusOnHover(awaitingWrapper, icon, local) {
    awaitingWrapper.addEventListener(
      "mouseenter",
      function() {
        icon.dispatchEvent(new Event("click"));
        local.UnfocusOthers(true);
        visualFeedback(this, false);
      }
    );
    awaitingWrapper.addEventListener(
      "mouseleave",
      function() {
        local.FocusParents(true);
        visualFeedback(this, true);
      }
    );
  }
  function Local$2(input, wrapper, parentTarget) {
    const { icon, mainDDM, ddm_focus } = input;
    const getContent = () => parentTarget?.closest(".dropdown-content");
    function blur() {
      if (!isRendered(wrapper)) {
        icon.removeEventListener("blur", blur);
      } else {
        FocusParents(false);
      }
    }
    function FocusParents(toggle = true) {
      [getContent(), mainDDM].forEach(
        (el) => toggleClasses(toggle, [ddm_focus], el)
      );
      if (toggle) {
        icon.dispatchEvent(new Event("click"));
      }
    }
    function UnfocusOthers(toggle) {
      document.queryAllasArr(".dropdown-item.yt-gif-wrapper-parent").map((tut) => tut.closest(".dropdown-info-box.dropdown-focus")).filter((v, i, a) => !!v && v != getContent() && a.indexOf(v) === i).forEach((el) => toggleClasses(!toggle, [ddm_focus], el));
    }
    return { blur, FocusParents, UnfocusOthers };
  }
  function visualFeedback(el, bol2) {
    toggleClasses(bol2, [cssData.ddn_tut_awaiting], el);
  }
  async function DeployTutorial(parentTarget, input) {
    if (!parentTarget || parentTarget.querySelector(".yt-gif-wrapper")) {
      return;
    }
    const tutWrapper = parentTarget.querySelector("[data-video-url]");
    Array.from(tutWrapper.attributes).filter((attr) => attr.name != "data-video-url").forEach((attr) => tutWrapper.removeAttribute(attr.name));
    const awaitingWrapper = await onYouTubePlayerAPIReady({
      wrapper: tutWrapper,
      targetClass: "yt-gif-ddm-tutorial",
      dataCreation: "force-awaiting",
      message: "testing manual ty gif tutorial"
    });
    const local = Local$2(input, awaitingWrapper, parentTarget);
    input.icon.addEventListener("blur", local.blur);
    if (awaitingWrapper) {
      FocusOnHover(awaitingWrapper, input.icon, local);
    }
  }
  function toggleFoldAnim(bol2, el) {
    toggleClasses(!bol2, ["absolute"], el);
    toggleClasses(bol2, ["w-full"], el);
  }
  function selectObj(select, input) {
    const ddm = select.closest(".ddm-tut");
    const tuts = ddm.querySelector(".yt-gifs-tuts");
    const options = Array.from(select.options).map((o) => o.value);
    const htmls = [...options].reduce((acc, crr) => {
      const { item, itemHtmml } = assebleTutElm(crr);
      tuts?.appendChild(item);
      acc[crr] = itemHtmml;
      return acc;
    }, {});
    const target = (v) => ddm.querySelector(`[select="${v}"]`);
    const html = (v) => htmls[v];
    return {
      select,
      ddm,
      container: select.closest(".dropdown"),
      resetOptions: async function() {
        for (const value of options) {
          const wrapper = target(value);
          if (!(wrapper instanceof HTMLElement))
            continue;
          wrapper.style.display = "none";
          wrapper.innerHTML = html(value);
        }
      },
      ShowOption: async function() {
        if (select.value == "disabled")
          return toggleFoldAnim(false, ddm);
        toggleFoldAnim(true, ddm);
        const wrapper = target(select.value);
        wrapper.style.display = "block";
        await DeployTutorial(wrapper, input);
      }
    };
    function assebleTutElm(crr) {
      const item = div(["dropdown-item"]);
      item.setAttribute("select", crr);
      const tut = div();
      tut.setAttribute("data-video-url", `https://youtu.be/${crr}`);
      item.appendChild(tut);
      return { item, itemHtmml: item.innerHTML };
    }
  }
  function getTutorialObj(container) {
    const btn = container.querySelector(
      "input[class*=bp3-icon-]"
    );
    const pulseElm = container.querySelector(
      ".drodown_item-pulse-animation"
    );
    const iconObj = getIconFlipObj(btn);
    const parentSelector = getUniqueSelector(
      container.querySelector("[data-video-url]")?.parentElement
    );
    return {
      iconObj,
      btn,
      pulseElm,
      id: container.id,
      target: () => container.querySelector(parentSelector),
      ok: iconObj.falseVal && iconObj.trueVal && btn
    };
  }
  function SetUpSelectTutorials(input) {
    document.queryAllasArr(".ddm-tut select").filter((el) => !!el).map((sel2) => selectObj(sel2, input)).forEach(ListenToDeploy);
  }
  function ListenToDeploy(o) {
    toggleFoldAnim(false, o.ddm);
    o.select.addEventListener("change", async () => {
      o.resetOptions();
      await o.ShowOption();
    });
    o.container?.addEventListener("mouseenter", async () => o.ShowOption());
    const selected = o.select.querySelector("[selected]")?.value;
    if (selected) {
      o.select.dispatchEvent(new Event("change"));
    }
  }
  function assignFirstAnchorWave({ raw_anchorSel } = cssData) {
    document.queryAllasArr(`.${raw_anchorSel}`).forEach(onRenderedCmpt_cb);
  }
  async function onRenderedCmpt_cb(cmpt) {
    if (!isRendered(cmpt)) {
      return;
    }
    const anchorWrp = span(["yt-gif-anchor-wrapper"]);
    anchorWrp.insertAdjacentHTML("afterbegin", links.html.fetched.anchor);
    const tempUID = getUidFromBlock(cmpt, true);
    if (!tempUID) {
      return;
    }
    const componentMap = await getAnchor_smart(tempUID);
    const uid = [...componentMap.values()]?.[0];
    const anchor = anchorWrp.querySelector(".yt-gif-anchor");
    const tooltipObj = GetAnchorTooltip(anchor, uid);
    ToggleTooltips(true, tooltipObj);
    cmpt.parentElement?.replaceChild(anchorWrp, cmpt);
    if (uid) {
      closest_container(anchor)?.setAttribute(
        "yt-gif-anchor-container",
        uid
      );
    } else {
      anchor.setAttribute("disabled", "");
    }
    RemovedElementObserver({
      el: anchorWrp,
      OnRemovedFromDom_cb: () => anchorInstanceMap.delete(tempUID)
    });
  }
  function GetAnchorTooltip(anchor, uid) {
    const obj = getTooltipFlipObj(anchor);
    return {
      ...obj,
      trueVal: obj.falseVal?.replace(Anchor_Config.uidRefRgx, `((${uid}))`)
    };
  }
  function SetupAnchorObserver() {
    const anchorObs = new MutationObserver(
      async (mutations) => Mutation_cb_raw_rm_cmpts(
        mutations,
        cssData.raw_anchorSel,
        onRenderedCmpt_cb
      )
    );
    anchorObs.observe(document.body, { childList: true, subtree: true });
  }
  function getYTUrlObj(rm_btn) {
    const ytUrlEl = rm_btn?.nextSibling;
    let url2 = ytUrlEl?.href;
    if (!YTGIF_Config.guardClause(url2))
      url2 = "";
    return { url: url2, ytUrlEl };
  }
  function NodesRecord(Nodes, sel2) {
    if (!Nodes || Nodes.length == 0)
      return [];
    const ElsArr = Array.from(Nodes).map((nd) => nd).filter((el) => !!el.tagName);
    return ElsArr.map((x) => {
      if (x.classList.contains(sel2))
        return x;
      else
        return Array.from(x.querySelectorAll(`.${sel2}`));
    }).flat(Infinity).filter((v, i, a) => {
      v = v;
      return !!v && getYTUrlObj(v).url && !hasYTGifAttr(v) && !hasYTGifClass(v) && v.classList.contains(sel2) && a.indexOf(v) === i && isRendered(v);
    });
  }
  function hasYTGifClass(b) {
    return Array.from(b.classList).some((x) => x.includes("yt-gif"));
  }
  function hasYTGifAttr(b) {
    return Array.from(b.attributes).map((a) => a.name).some((x) => x.includes("yt-gif"));
  }
  async function OnYtGifUrlBtn(e, ref, fromObj = {}) {
    const tEl = e.currentTarget;
    const rm_btn = ref.target;
    e.stopPropagation();
    e.preventDefault();
    const block = closestBlock(rm_btn);
    const tempUID = getUidFromBlock(block);
    const { url: url2, ytUrlEl } = getYTUrlObj(rm_btn);
    if (!ValidUrlBtnUsage())
      return console.warn("YT GIF Url Button: Invalid Simulation keys");
    if (!tempUID || !url2)
      return console.warn(
        `YT GIF Url Button: Couldn't find any url within the block: ((${tempUID}))`
      );
    const awaiting = (bol2) => {
      awaitingAtrr(bol2, rm_btn);
      awaitingAtrr(bol2, tEl);
    };
    if (rm_btn.hasAttribute("awaiting"))
      return;
    awaiting(true);
    function getSettings(e2, outterObj, fromObj2) {
      return {
        block,
        targetNode: ytUrlEl,
        siblingSel: `.bp3-icon-video + a[href*="youtu"]`,
        selfSel: `.bp3-icon-video + a[href*="${url2}"]`,
        getMap: async () => getComponentMap(tempUID, URL_Config),
        isKey: "is substring",
        tempUID,
        from: {
          caster: "rm-btn",
          urlBtn: e2.target,
          ...fromObj2
        },
        ...outterObj
      };
    }
    await TryToUpdateBlock_fmt(getSettings(e, ref, fromObj));
    awaiting(false);
  }
  function ReadyUrlBtns(added) {
    for (const rm_btn of added) {
      toggleClasses(true, ["yt-gif"], rm_btn);
      appendlUrlBtns(rm_btn);
      const Ref = (cb) => ({ target: rm_btn, fmtCmpnt_cb: cb });
      if (validTmParam(getYTUrlObj(rm_btn).url)) {
        const i = fmtIframe2Url(rm_btn);
        i.urlBtn("format").onclick = async (e) => OnYtGifUrlBtn(e, Ref(i.updUrl), { param: "t", float: false });
      }
      const o = fmtTimestampsUrlObj(rm_btn);
      const { urlBtn } = o;
      urlBtn("yt-gif").onclick = async (e) => OnYtGifUrlBtn(e, Ref(o.ytGifCmpt));
      urlBtn("start").onclick = async (e) => OnYtGifUrlBtn(e, Ref(o.startCmpt));
      urlBtn("end").onclick = async (e) => OnYtGifUrlBtn(e, Ref(o.endCmpt));
      urlBtn("start|end").onclick = async (e) => OnYtGifUrlBtn(e, Ref(o.startEndCmpt));
      o.confirmBtns();
    }
  }
  async function InlineUrlBtnMutations_cb(mutationsList) {
    let added = [];
    for (const { addedNodes } of mutationsList)
      added = [...added, ...NodesRecord(addedNodes, "bp3-icon-video")];
    ReadyUrlBtns(added);
  }
  const deployInfo = {
    suspend: `Suspend Observers`,
    deploy: `Deploy Observers`,
    discharging: `** Disconecting Observers **`,
    loading: `** Setting up Observers **`
  };
  const { dwn_no_input } = cssData;
  const noInputAnimation = [dwn_no_input];
  function InputGate(deploy2, {
    setText,
    sameLabel,
    visualFeedback: visualFeedback2,
    HoldInputFor10Secs
  }) {
    const {
      dropdown_fadeIt_bg_animation,
      dropdown_forbidden_input,
      dropdown_allright_input
    } = cssData;
    const baseAnimation = [dropdown_fadeIt_bg_animation, ...noInputAnimation];
    const redAnimationNoInputs = [...baseAnimation, dropdown_forbidden_input];
    const greeAnimationInputReady = [...baseAnimation, dropdown_allright_input];
    async function redCombo() {
      setText(deployInfo.discharging);
      visualFeedback2(false);
      window.YT_GIF_OBSERVERS.CleanMasterObservers();
      await HoldInputFor10Secs(redAnimationNoInputs);
      setText(deployInfo.deploy);
    }
    async function greenCombo() {
      rm_components.ChargeMasterObserversWithValidDeploymentStyle();
      setText(deployInfo.loading);
      visualFeedback2(true);
      await HoldInputFor10Secs(greeAnimationInputReady);
      setText(deployInfo.suspend);
    }
    async function OnInputFlow() {
      if (!deploy2.menu.checked) {
        return;
      }
      if (sameLabel(deployInfo.suspend)) {
        await redCombo();
      } else if (sameLabel(deployInfo.deploy)) {
        await greenCombo();
      }
    }
    async function OnSubmit() {
      if (deploy2.sub.checked && sameLabel(deployInfo.deploy)) {
        await greenCombo();
      }
    }
    return { OnInputFlow, OnSubmit };
  }
  function Label(labelCheckMenu) {
    labelCheckMenu.textContent = deployInfo.suspend;
    function sameLabel(str2) {
      return labelCheckMenu.textContent == str2;
    }
    function setText(str2) {
      return labelCheckMenu.textContent = str2;
    }
    return { sameLabel, setText };
  }
  function Show() {
    const { dropdown__hidden, dropdown_deployment_style, dwp_message } = cssData;
    const subHiddenDDM = document.querySelector(
      `.${dropdown__hidden}.${dropdown_deployment_style}`
    );
    const subHiddenDDM_message = subHiddenDDM.querySelector(`.${dwp_message}`);
    function visualFeedback2(bol2) {
      isSubMenuHidden(bol2);
      isSubDDMpulsing(!bol2);
    }
    function isSubMenuHidden(bol2) {
      const hiddenClass = [`${cssData.dropdown__hidden}`];
      toggleClasses(bol2, hiddenClass, subHiddenDDM);
    }
    function isSubDDMpulsing(bol2) {
      const pulseAnim = [cssData.dwn_pulse_anim];
      toggleClasses(bol2, pulseAnim, subHiddenDDM_message);
    }
    return { visualFeedback: visualFeedback2, subHiddenDDM };
  }
  function Check(deploy2) {
    function disable(b) {
      Object.values(deploy2).forEach((check2) => check2.disabled = b);
    }
    function check(b) {
      Object.values(deploy2).forEach((check2) => check2.checked = b);
    }
    function DeployCheckboxesToggleAnims(bol2, animation) {
      toggleClasses(bol2, animation, deploy2.menu.parentElement);
      toggleClasses(bol2, noInputAnimation, deploy2.menu.parentElement);
    }
    function HoldInputFor10Secs(animation, duration = 1e4) {
      return new Promise(function(resolve) {
        disable(true);
        check(false);
        DeployCheckboxesToggleAnims(true, animation);
        setTimeout(() => {
          disable(false);
          check(false);
          DeployCheckboxesToggleAnims(false, animation);
          resolve();
        }, duration);
      });
    }
    return { HoldInputFor10Secs };
  }
  async function MasterObserver_UCS_RTM() {
    const checkboxes = {
      menu: UI$1.deploymentStyle.suspend_yt_gif_deployment,
      sub: UI$1.deploymentStyle.deploy_yt_gifs
    };
    const label = checkboxes.menu.previousElementSibling;
    const local = Label(label);
    const show = Show();
    const checkbox = Check(checkboxes);
    const input = InputGate(checkboxes, { ...local, ...show, ...checkbox });
    checkboxes.menu.addEventListener("change", input.OnInputFlow);
    checkboxes.sub.addEventListener("change", input.OnSubmit);
  }
  function SetUpTutorials_smartNotification() {
    ["tut_update_ver"].map((id) => document.querySelector(`[id="${id}"]`)).filter((el) => el != null).map((el) => getTutorialObj(el)).filter((o) => o.ok).forEach(toggleIconOnChange);
  }
  function toggleIconOnChange(o) {
    const { btn } = o;
    const visualFeedback2 = GetVisualFeedback(o);
    btn.addEventListener("change", () => visualFeedback2(btn.checked));
    CheckOnLocalStorage(o, visualFeedback2);
  }
  function GetVisualFeedback(o) {
    return function(bol2) {
      bol2 = ToggleIcons(bol2, o.iconObj);
      toggleClasses(!bol2, [cssData.dwn_pulse_anim], o.pulseElm);
    };
  }
  function CheckOnLocalStorage({ btn, id }, visualFeedback2) {
    if (hasOneDayPassed_localStorage(id)) {
      btn.checked = true;
      btn.dispatchEvent(new Event("change"));
    } else {
      const sessionValue = window.YT_GIF_DIRECT_SETTINGS.get(id)?.sessionValue;
      const bol2 = typeof sessionValue === "undefined" ? true : isTrue(sessionValue);
      btn.checked = bol2;
      visualFeedback2(bol2);
    }
  }
  function ResetMasterObservers() {
    if (DDM_Els().length > 0) {
      try {
        window.YT_GIF_OBSERVERS.CleanMasterObservers();
        window.YT_GIF_OBSERVERS.CleanLoadedWrappers();
        window.YT_GIF_OBSERVERS.masterIframeBuffer = new Array();
      } catch (err) {
        console.warn(`YT GIF's Masters observers are not defined.`);
      }
      console.log("Reinstalling the YT GIF Extension");
    }
  }
  function confirmUrlBtnUsage(bol2, e) {
    const canUse = ValidUrlBtnUsage();
    if (!bol2 || canUse)
      return;
    const yesMessage = canUse ? "Simulate because I have both graph and localStorage keys" : "Simulate, but first take me to the caution prompt - localStorage key is missing";
    const userMind = confirm(
      `YT GIF Url Button: Simulation Request

YES: ${yesMessage} 
   -  https://github.com/kauderk/kauderk.github.io/blob/main/yt-gif-extension/install/faq/README.md#simulate-url-button-to-video-component 

NO: Don't simulate`
    );
    if (userMind) {
      localStorage.setItem(s_u_f_key, "true");
      if (!canUse)
        window.open(
          "https://github.com/kauderk/kauderk.github.io/tree/main/yt-gif-extension/install/faq#caution-prompt",
          "_blank"
        )?.focus();
    } else {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.customSelect?.(false);
        e.currentTarget.parentElement?.dispatchEvent(
          new Event("customChange")
        );
      }
      localStorage.removeItem(s_u_f_key);
    }
    return userMind;
  }
  function ToggleUrlBtnObserver(bol2, obs) {
    obs.disconnect();
    if (bol2) {
      const allUrlBtns_rm = document.queryAllasArr(".bp3-icon-video").filter(
        (b) => !hasYTGifAttr(b) && !hasYTGifClass(b) && getYTUrlObj(b).url
      );
      ReadyUrlBtns(allUrlBtns_rm);
      document.queryAllasArr(
        ".yt-gif-controls :is([formatter],[insertOptions]), [yt-gif-timestamp-emulation]"
      ).forEach((el) => el?.tryToAppendUrlBtns?.());
      obs.observe(document.body, { childList: true, subtree: true });
    } else {
      document.queryAllasArr(`.yt-gif-url-btns-wrapper`).forEach((el) => el.remove());
      document.queryAllasArr(".bp3-icon-video").forEach((el) => el.classList.remove("yt-gif"));
    }
  }
  function ToggleBtnsWithNoUrl(bol2) {
    document.queryAllasArr(".yt-gif-url-btns-wrapper[no-url]").forEach((wrp) => toggleAttribute(!bol2, "style", wrp, "display: none"));
  }
  function addCustomChangeListener(option, cb) {
    option.addEventListener("customChange", cb);
  }
  function ListenForUrlOptions(urlObserver) {
    const url_formatter_option = getOption(UI$1.display.ms_options, s_u_f_key);
    const rely_on_hierarchy = getOption(
      UI$1.display.fmt_options,
      "rely_on_hierarchy"
    );
    const s_u_f_startUp = valid_url_formatter();
    url_formatter_option.customSelect?.(s_u_f_startUp);
    ToggleUrlBtnObserver(s_u_f_startUp, urlObserver);
    ToggleBtnsWithNoUrl(rely_on_hierarchy.selected);
    addCustomChangeListener(
      url_formatter_option,
      (e) => confirmUrlBtnUsage(e.detail.currentValue, e)
    );
    addCustomChangeListener(
      url_formatter_option,
      (e) => ToggleUrlBtnObserver(e.target.selected, urlObserver)
    );
    addCustomChangeListener(
      rely_on_hierarchy,
      (e) => ToggleBtnsWithNoUrl(e.target.selected)
    );
  }
  async function getTimestampObj_smart(page) {
    const openInputBlock = getCurrentInputBlock();
    const uid = getUidFromBlock(openInputBlock);
    const failObj = {};
    if (!page || !uid || !openInputBlock)
      return failObj;
    const { ok, formats, targetBlock } = await getLastAnchorCmptInHierarchy(uid);
    if (!ok)
      return failObj;
    const { lessHMS, HMS, hmsSufix, S } = formats;
    const obj = (v) => ({
      value: v,
      fmt: `{{[[yt-gif/${page}]]: ${v} }}`
    });
    return {
      lessHMS: obj(fmt({ lessHMS })),
      HMS: obj(fmt({ HMS })),
      hmsSufix: obj(fmt({ hmsSufix })),
      S: obj(parseInt(S || targetBlock[page].S)),
      uid: targetBlock?.uid
    };
    function fmt(o) {
      const key = Object.keys(o)[0];
      const value = o[key];
      return !value || value?.includes?.("NaN") ? targetBlock[page][key] : value;
    }
  }
  window.YTGIF = {
    getTimestampObj: getTimestampObj_smart
  };
  async function addBlockTimestamp_smart_local(pageRefSufx) {
    const timestampObj2 = await getTimestampObj_smart(pageRefSufx);
    const uid = timestampObj2.uid;
    const component = timestampObj2[UI$1.timestamps.tm_workflow_grab.value]?.fmt ?? "";
    if (!uid)
      return console.warn(
        `YT GIF Timestamps: couldn't find YT GIFs within the Hierarchy: ((${uid}))`
      );
    if (!component)
      return console.warn(
        `YT GIF Timestamps: couldn't find values with the keyword "${UI$1.timestamps.tm_workflow_grab.value}" from ((${uid}))`
      );
    const { updatedString, el } = concatStringAtCaret(
      getCurrentInputBlock(),
      component
    );
    await updateBlock(uid, updatedString);
    await sleep$1(50);
    updateAtCaret(getCurrentInputBlock(), el.selectionEnd ?? 0);
  }
  function updateAtCaret(el, atLength = 0, start = false) {
    if (start)
      el.selectionStart = el.selectionEnd = atLength;
    else
      el.selectionEnd = el.selectionStart = atLength;
    el.focus();
  }
  function concatStringAtCaret(el, newText) {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const text = el.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    el.value = before + newText + after;
    updateAtCaret(el, end + newText.length);
    return { updatedString: el.value, el };
  }
  async function registerKeyCombinations(e) {
    if (!((e.ctrlKey || e.metaKey) && e.altKey))
      return;
    let pageRefSufx = null;
    if (e.key == "s")
      pageRefSufx = "start";
    else if (e.key == "d")
      pageRefSufx = "end";
    if (!pageRefSufx)
      return;
    await addBlockTimestamp_smart_local(pageRefSufx);
  }
  function ToggleTimestampShortcuts(bol2, keyupEventHandler) {
    document.removeEventListener("keydown", keyupEventHandler);
    if (bol2) {
      keyupEventHandler = registerKeyCombinations;
      document.addEventListener("keydown", keyupEventHandler);
    }
  }
  const componentClass = (page) => `bp3-button bp3-small dont-focus-block rm-xparser-default-${page}`;
  const timestampObj = {
    roamClassName: "rm-video-timestamp dont-focus-block",
    start: {
      targetClass: "rm-xparser-default-start",
      buttonClass: componentClass("start")
    },
    end: {
      targetClass: "rm-xparser-default-end",
      buttonClass: componentClass("end")
    },
    attr: {
      emulation: "yt-gif-timestamp-emulation",
      timestampStyle: "timestamp-style",
      timestamp: "timestamp"
    },
    timestamp: {
      buttonClass: componentClass("timestamp")
    },
    parent: {
      className: "yt-gif-timestamp-parent"
    }
  };
  const isKey = "is component";
  function hasAnyVideoUrl(capture) {
    return ExtractUrlsObj(ExtractContentFromCmpt(capture))?.match;
  }
  function OutOfBoundsSibling(targetIndex, targetNodeParent) {
    return targetIndex == -1 || !targetNodeParent || !targetNodeParent?.parentNode;
  }
  function DelayedBlocks(startEndComponentMap, siblingsArr, node) {
    return !startEndComponentMap || startEndComponentMap.size !== siblingsArr.length && !Value_AtIndexInMap(
      startEndComponentMap,
      siblingsArr.indexOf(node),
      isKey
    );
  }
  function Local$1(found) {
    const componentMapMap = /* @__PURE__ */ new Map();
    let _startEndMap = /* @__PURE__ */ new Map();
    return {
      componentMapMap,
      siblingsArr: Array(),
      get startEndMap() {
        return _startEndMap;
      },
      map_successfulEmulationArr: /* @__PURE__ */ new Map(),
      renderedComponents: found.filter(
        (el) => isRendered(el) && isNotZoomPath(el)
      ),
      TryUpdateAgain,
      update_startEndComponentMap,
      TryUpdateMap
    };
    async function TryUpdateMap(ids, siblingsArr, node) {
      await update_startEndComponentMap(ids);
      if (DelayedBlocks(_startEndMap, siblingsArr, node)) {
        await TryUpdateAgain(ids);
      }
    }
    async function TryUpdateAgain(ids) {
      await sleep(800);
      await AddTimestampMap(ids);
      await update_startEndComponentMap(ids);
    }
    async function update_startEndComponentMap({ mapsKEY, tempUID }) {
      _startEndMap = await getMap_smart(
        mapsKEY,
        componentMapMap,
        getComponentMap,
        tempUID,
        StartEnd_Config
      );
    }
    async function AddTimestampMap({ mapsKEY, tempUID }) {
      componentMapMap.set(
        mapsKEY,
        await getComponentMap(tempUID, StartEnd_Config)
      );
    }
  }
  function GetBlockIDs(block) {
    return {
      mapsKEY: block.id,
      tempUID: getUidFromBlock(block)
    };
  }
  async function getCashedEmulationArr(mapsKEY, map_successfulEmulationArr) {
    return await getMap_smart(
      mapsKEY,
      map_successfulEmulationArr,
      () => Array()
    );
  }
  function GetTargetObj(siblingsArr, node, startEndMap) {
    const defaultParent = siblingsArr.find((x) => x === node);
    const index = siblingsArr.indexOf(node);
    if (OutOfBoundsSibling(index, defaultParent)) {
      return null;
    }
    const content = Value_AtIndexInMap(startEndMap, index, isKey);
    if (!content) {
      return null;
    }
    return { index, defaultParent, content };
  }
  function getPositionObj(ObjAsKey, targetNodeParent) {
    const { indent, similarCount, uid: fromUid } = ObjAsKey;
    const similarCountButRoot = indent == 0 ? 0 : similarCount;
    return {
      indent,
      similarCount,
      fromUid,
      fromUniqueUid: fromUid + similarCountButRoot,
      page: ["start", "end"].find(
        (key) => targetNodeParent?.classList.contains(
          timestampObj[key]?.targetClass
        )
      ) || "timestamp"
    };
  }
  function ClearParentNode(targetNodeParent) {
    Array.from(targetNodeParent.attributes)?.forEach?.(
      (attr) => targetNodeParent?.removeAttribute(attr.name)
    );
    targetNodeParent = ChangeElementType(targetNodeParent, "div");
    targetNodeParent.className = timestampObj.parent.className;
    targetNodeParent.innerHTML = "";
    return targetNodeParent;
  }
  function CreatePlaceholder(h, content) {
    const targetNode = elm([], "a");
    targetNode.setAttribute(timestampObj.attr.timestampStyle, h.page);
    targetNode.setAttribute(timestampObj.attr.emulation, "");
    targetNode.setAttribute(timestampObj.attr.timestamp, content);
    targetNode.className = timestampObj.roamClassName;
    const a = elm([], "a");
    targetNode.appendChild(a);
    targetNode.a = a;
    targetNode.a.textContent = content;
    targetNode.a.textContent = fmtTimestamp()(targetNode.a.textContent);
    return targetNode;
  }
  function GetTmSetObj(target, startEndMap, block, ids) {
    const { index, content } = target;
    const ObjAsKey = ObjKey_AtIndexInMap(startEndMap, index, isKey);
    const position = getPositionObj(ObjAsKey, target.defaultParent);
    const parent = ClearParentNode(target.defaultParent);
    const placeholder = CreatePlaceholder(position, content);
    const { tempUID, mapsKEY } = ids;
    const tmSetObj = {
      ...position,
      targetIndex: index,
      tempUID,
      targetNode: placeholder,
      appendToParent: () => parent?.appendChild(placeholder),
      targetNodeParent: parent,
      timestamp: content,
      hasAnyVideoUrl: hasAnyVideoUrl(ObjAsKey.capture),
      color: window.getComputedStyle(placeholder).color,
      ObjAsKey,
      blockUid: tempUID,
      block,
      blockID: mapsKEY,
      startEndComponentMap: startEndMap
    };
    return tmSetObj;
  }
  const componentSel = `.${timestampObj.end.targetClass}, .${timestampObj.start.targetClass}, .${timestampObj.parent.className}`;
  async function SetupRerenderedComponents(found) {
    const local = Local$1(found);
    let siblingsArr = [];
    for (const node of local.renderedComponents) {
      const block = closestBlock(node);
      if (!block) {
        continue;
      }
      siblingsArr = ElementsPerBlock(block, `:is(${componentSel})`);
      const ids = GetBlockIDs(block);
      await local.TryUpdateMap(ids, siblingsArr, node);
      const target = GetTargetObj(siblingsArr, node, local.startEndMap);
      if (!target) {
        continue;
      }
      const tmSetObj = GetTmSetObj(target, local.startEndMap, block, ids);
      const cashed = await getCashedEmulationArr(
        tmSetObj.blockID,
        local.map_successfulEmulationArr
      );
      cashed.push(tmSetObj);
    }
    return local.map_successfulEmulationArr;
  }
  async function tryToGetUrlDuration(id) {
    const key = window.YT_GIF_DIRECT_SETTINGS.get("YT_API_KEY_V3")?.sessionValue;
    if (!key)
      return null;
    try {
      const url2 = `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${key}&part=snippet,contentDetails`;
      const res = await asyncAjax(url2);
      const youtube_time = res.items[0].contentDetails.duration;
      console.log(`youtube_time: ${youtube_time}, id: ${id}`);
      return formatISODate(youtube_time);
    } catch (error) {
    }
    return null;
  }
  function asyncAjax(url2) {
    return new Promise(function(resolve, reject) {
      $.ajax({
        url: url2,
        type: "GET",
        dataType: "json",
        beforeSend: function() {
        },
        success: (data) => resolve(data),
        error: (err) => reject(err)
      });
    });
  }
  function formatISODate(youtube_time) {
    const arr = youtube_time.match(/(\d+)(?=[MHS])/gi) || [];
    return arr.map((i) => i.length < 2 ? "0" + i : i).join(":");
  }
  async function durationObj(succesfulEmulationMap) {
    const obj = { getDuration: () => -1 };
    if (!isSelected(UI$1.timestamps.tm_options, "YT_API_KEY_V3")) {
      return obj;
    }
    let wrapperObjs = Array();
    const rawTargets = [...succesfulEmulationMap.values()].map(
      (arrs) => arrs[0]?.targetNodeParent
    );
    if (rawTargets.length == 0) {
      return obj;
    }
    for (const el of rawTargets) {
      const o = await getWrapperInHierarchyObj(el);
      if (!wrapperObjs.find((x) => x.id == o.id)) {
        wrapperObjs.push(o);
      }
    }
    const durationMap = /* @__PURE__ */ new Map();
    for (const wo of wrapperObjs) {
      const lastUrl = wo.lastWrapper?.getAttribute("data-video-url");
      const videoId = getYouTubeVideoID(lastUrl ?? "") || "invalid";
      if (durationMap.has(wo.id) && !durationMap.get(wo.id))
        YTvideoIDs.delete(videoId);
      durationMap.set(
        wo.id,
        await getMap_smart(
          videoId,
          YTvideoIDs,
          tryToGetUrlDuration,
          videoId
        )
      );
    }
    return {
      getDuration(targetBlockID) {
        const foundBlockID = wrapperObjs.find(
          (x) => x.container?.contains(document.getElementById(targetBlockID))
        )?.id;
        return durationMap.get(foundBlockID);
      }
    };
  }
  function GetDuration(duration) {
    return duration ?? false ? fmtTimestamp("S")(duration + "") : duration;
  }
  function sortObjByKey(key, obj) {
    const groupBy = (key2) => (array) => array.reduce((objectsByKeyValue, obj2) => {
      const value = obj2[key2];
      objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj2);
      return objectsByKeyValue;
    }, {});
    const groupByKey = groupBy(key);
    const objByKey = groupByKey(obj);
    return Object.entries(objByKey).map(([title, data]) => ({
      title,
      data
    }));
  }
  function SortEmulationArr(values) {
    const _values = [...values].sort((a, b) => a.indent - b.indent);
    const sortedByUid = sortObjByKey("fromUniqueUid", _values);
    const targetObjsArr = sortedByUid.map((v) => v["data"]);
    return targetObjsArr;
  }
  function GetPears(ArrObjs) {
    const findPage = (p) => [...ArrObjs].reverse().find((x) => x.page == p);
    const lastArr = [findPage("start"), findPage("end")];
    const completePears = lastArr.every((el) => !!el);
    return { lastArr, completePears };
  }
  function PulseObj(tEl) {
    const base2 = ["yt-timestamp-pulse-text-anim"];
    const animations = {
      green: [...base2, "yt-timestamp-success"],
      red: [...base2, "yt-timestamp-warn"],
      blue: [...base2, "yt-timestamp-opening"],
      purple: [...base2, "yt-timestamp-reset"],
      blueViolet: [...base2, "yt-timestamp-pause"],
      all: Array()
    };
    animations["all"] = Object.values(animations).flat(Infinity).filter((v, i, a) => a.indexOf(v) === i);
    function pulse(anim = "green") {
      toggleClasses(false, animations["all"], tEl);
      toggleClasses(true, animations[anim], tEl);
      setTimeout(() => toggleClasses(false, animations[anim], tEl), 500);
    }
    return pulse;
  }
  async function getYTwrapperRootObj(uid, tEl) {
    const { foundBlock } = await getLastAnchorCmptInHierarchy(uid);
    if (!foundBlock?.uid)
      console.warn(
        `YT GIF Timestamps: couldn't find YT GIFs within the Hierarchy: ((${uid}))`
      );
    const { uid: f_uid } = foundBlock || { uid: "" };
    return _getYTwrapperRootObj(f_uid, tEl);
  }
  async function _getYTwrapperRootObj(f_uid, tEl) {
    const barObj = {
      tEl,
      condition: function() {
        return this.tEl?.closest(`.${this.root}`) ? true : false;
      }
    };
    const PagesObj = {
      main: {
        root: "roam-article",
        crossRoot: "rm-sidebar-outline",
        ...barObj
      },
      side: {
        root: "rm-sidebar-outline",
        crossRoot: "roam-article",
        ...barObj
      },
      pageRef: {
        root: "rm-reference-main",
        crossRoot: "rm-sidebar-outline",
        ...barObj
      }
    };
    const key = ObjectKeys(PagesObj).find((x) => PagesObj[x].condition());
    const { root, crossRoot } = PagesObj[key];
    const blockExist = document.querySelector(`.${root} [id$="${f_uid}"]`);
    const WrappersInBlock = (r) => {
      const wrappers = document.queryAllasArr(
        `.${r} [id$="${f_uid}"] .yt-gif-wrapper`
      );
      if (r == PagesObj.main.crossRoot)
        return wrappers;
      return wrappers.map((pw) => closest_container_request(pw)).filter((pc) => pc?.contains(tEl)).map((c) => c?.queryAllasArr(`[id$="${f_uid}"] .yt-gif-wrapper`)).flat(Infinity);
    };
    const lastWrapperInBlock = (r = root) => [...WrappersInBlock(r)]?.pop() ?? null;
    return {
      lastWrapperInBlock,
      WrappersInBlock,
      f_uid,
      blockExist: !!blockExist && lastWrapperInBlock(root),
      root,
      crossRoot,
      mainRoot: PagesObj.main.root
    };
  }
  async function getRelevantWrapperObjFunc1(tEl, { tmSetObj, uid }) {
    const yuid = (el) => el?.getAttribute("yt-gif-anchor-container");
    const buid = (el) => el?.getAttribute("yt-gif-block-uid");
    let anchorUid;
    if (isSelected(UI$1.timestamps.tm_options, "anchor"))
      anchorUid = buid(tEl?.closest("[yt-gif-block-uid]")) || yuid(closest_anchor_container(tmSetObj.self.targetNode));
    const m_uid = anchorUid || uid;
    const getWrapperObj = m_uid != uid ? _getYTwrapperRootObj : getYTwrapperRootObj;
    return getWrapperObj(m_uid, tEl);
  }
  function getClicks1(which) {
    return {
      left: which == 1,
      right: which == 3,
      middle: which == 2
    };
  }
  function ToggleBoundarySet1(bol2, tmSetObj, targetWrapper) {
    toggleActiveAttr(bol2, tmSetObj.self.targetNode);
    if (tmSetObj.pear) {
      toggleActiveAttr(bol2, tmSetObj.pear.targetNode);
    }
    toggleAttribute(bol2, "last-active-timestamp", tmSetObj.self.targetNode);
    if (targetWrapper) {
      toggleAttribute(bol2, "yt-active", targetWrapper);
    }
    function toggleActiveAttr(bol22, el) {
      if (el)
        toggleAttribute(bol22, "active-timestamp", el);
    }
  }
  function TogglePlayAttr_SimHover1(pulse, lastWrapper) {
    pulse("blueViolet");
    const iframe = lastWrapper?.querySelector("iframe");
    if (iframe?.hasAttribute("yt-playing")) {
      lastWrapper?.dispatchEvent(simHoverOut());
    } else if (iframe) {
      lastWrapper?.dispatchEvent(simHover());
    }
  }
  function TryDispatchCustomPlayerReady({
    timestampObj: timestampObj2,
    obsTimestamp,
    targetWrapper
  }) {
    const detail = {
      ...timestampObj2,
      updateTime: timestampObj2.currentTime ?? timestampObj2.seekTo,
      playRightAway: UI$1.timestamps.tm_seek_action.value == "play",
      mute: UI$1.timestamps.tm_seek_action.value == "mute",
      obsTimestamp
    };
    targetWrapper?.dispatchEvent(
      new CustomEvent("customPlayerReady", {
        detail,
        cancelBubble: true
      })
    );
  }
  function TrySeekToFlow({
    seekToMessage,
    record,
    timestampObj: timestampObj2
  }) {
    const { ok, currentTime, seekTo, start } = timestampObj2;
    if (seekToMessage == "seekTo-soft" && ok) {
      record?.wTarget?.seekTo(currentTime);
    } else if (seekTo != start) {
      record?.wTarget?.seekTo(seekTo);
    }
  }
  function CanGoOn({
    pulse,
    boundaryObj,
    seekToMessage,
    simMessage
  }) {
    if (!boundaryObj.success) {
      return false;
    }
    if (simMessage == "visuals") {
      pulse("purple");
    } else {
      pulse("green");
    }
    const { ok } = boundaryObj.timestampObj;
    if (simMessage == "visuals" && ok && seekToMessage != "seekTo-strict") {
      return false;
    }
    return true;
  }
  function TryMutePausePlayer(record) {
    record?.isSoundingFine(UI$1.timestamps.tm_seek_action.value != "mute");
    record?.togglePlay(UI$1.timestamps.tm_seek_action.value != "pause");
  }
  async function tryPlayLastBlock(input) {
    if (!CanGoOn(input)) {
      return;
    }
    const { boundaryObj } = input;
    const { record, timestampObj: timestampObj2 } = boundaryObj;
    await TryReloadVideo({ t: record?.wTarget, ...timestampObj2 });
    TrySeekToFlow({ ...input, ...boundaryObj });
    TryMutePausePlayer(record);
    TryDispatchCustomPlayerReady(boundaryObj);
  }
  function getTimestampBoundaryObj(secondsOnly, record, targetBlockID, tmSetObj) {
    const start = sec("start") ? secondsOnly : pearSec() || 0;
    const end = sec("end") ? secondsOnly : pearSec() || record?.wTarget?.getDuration?.() || 0;
    const seekTo = sec("end") ? secondsOnly + 1 : secondsOnly;
    const tm = record?.wTarget?.getCurrentTime?.();
    const currentTimeAlternative = lastBlockIDParameters.get(targetBlockID)?.updateTime;
    const currentTime = tm ?? currentTimeAlternative?.value ?? start;
    const bounded = ((tm2 = currentTime) => tm2 >= start && tm2 <= end)();
    const farEnough = ((tm2 = currentTime) => tm2 + 1 > seekTo)();
    return {
      start,
      end,
      page: sec("end") ? "end" : "start",
      seekTo,
      currentTime,
      ok: bounded && farEnough
    };
    function sec(p) {
      return tmSetObj.self.page == p;
    }
    function pearSec() {
      return HMSToSecondsOnly(tmSetObj.pear?.timestamp || "");
    }
  }
  function GetRecordInfo(targetWrapper, f_uid) {
    const blockID = [...recordedIDs.keys()].reverse().find((k) => k.startsWith(closestYTGIFparentID(targetWrapper)));
    const record = recordedIDs.get(blockID);
    const obsBlockID = [...observedParameters.keys()].reverse().find((k) => k.endsWith(getWrapperUrlSufix(targetWrapper, f_uid)));
    const obsTimestampOrg = observedParameters.get(obsBlockID)?.lastActiveTimestamp;
    const timestamp = { ...obsTimestampOrg };
    return { record, timestamp, blockID };
  }
  function TryGetValidTimestamp(tEl) {
    return tEl.a.textContent?.match(StartEnd_Config.targetStringRgx)?.[0];
  }
  function PauseOthersBut(targetWrapper) {
    return document.queryAllasArr(".yt-gif-wrapper").filter((el) => !el.closest(".ddm-tut")).forEach((wrapper) => {
      toggleAttribute(false, "yt-active", wrapper);
      if (wrapper != targetWrapper)
        wrapper?.dispatchEvent(simHoverOut());
    });
  }
  function tryGetRecordBoundary(lastWrapper, validTimestamp, f_uid, ToggleBoundarySet, tmSetObj) {
    PauseOthersBut(lastWrapper);
    if (!validTimestamp) {
      return { success: false };
    }
    const { record, timestamp, blockID } = GetRecordInfo(lastWrapper, f_uid);
    DeactivateTimestampsInHierarchy(
      closest_anchor_container(lastWrapper),
      lastWrapper
    );
    ToggleBoundarySet(true, lastWrapper);
    const res = {
      sameBoundaries: record?.sameBoundaries(),
      success: true,
      record,
      obsTimestamp: timestamp,
      targetWrapper: lastWrapper,
      timestampObj: getTimestampBoundaryObj(
        HMSToSecondsOnly(validTimestamp),
        record,
        blockID,
        tmSetObj
      )
    };
    return res;
  }
  async function TryGoToBlockPage({
    WrappersInBlock,
    crossRoot,
    f_uid,
    root,
    mainRoot
  }) {
    if (WrappersInBlock(crossRoot).length == 0) {
      await navigateToUiOrCreate(f_uid, root == mainRoot, "block");
    }
  }
  async function SleepIfRendered({
    lastWrapperInBlock,
    crossRoot
  }) {
    const prevWrapper = lastWrapperInBlock(crossRoot);
    const isRendered2 = prevWrapper instanceof Element && isElementVisible(prevWrapper);
    await sleep(isRendered2 ? 50 : 500);
  }
  function Local(pulse, evt, last, input) {
    const { lastWrapperInBlock } = last;
    async function tryPlayLastBlock_SimHover(r) {
      await tryPlayLastBlock({
        pulse,
        boundaryObj: getBoundaryObj2(r),
        ...evt.detail
      });
      if (evt.ScrollKey()) {
        ScrollToTargetWrapper(r);
      }
    }
    function ScrollToTargetWrapper(r) {
      lastWrapperInBlock(r)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    }
    function getBoundaryObj2(r) {
      return tryGetRecordBoundary(
        lastWrapperInBlock(r),
        TryGetValidTimestamp(evt.tEl),
        last.f_uid,
        ToggleBoundarySet,
        input.tmSetObj
      );
    }
    function TryToDeactivateSet() {
      pulse("red");
      ToggleBoundarySet(false, lastWrapperInBlock(last.root));
    }
    function ToggleBoundarySet(bol2, targetWrapper) {
      ToggleBoundarySet1(bol2, input.tmSetObj, targetWrapper);
    }
    async function PlayPause_SimHover(r) {
      TogglePlayAttr_SimHover1(pulse, lastWrapperInBlock(r));
    }
    async function OpenBlockOnCrossRoot() {
      await setSideBarState(3);
      await sleep(50);
      pulse("blue");
      await TryGoToBlockPage(last);
      await SleepIfRendered(last);
      ScrollToTargetWrapper(last.crossRoot);
      await tryPlayLastBlock_SimHover(last.crossRoot);
    }
    return {
      tryPlayLastBlock_SimHover,
      PlayPause_SimHover,
      OpenBlockOnCrossRoot,
      TryToDeactivateSet
    };
  }
  function Event$1(e) {
    const { currentTarget: tEl } = e;
    return {
      tEl,
      resolve: () => tEl.removeAttribute("awaiting"),
      isPending: () => tEl.hasAttribute("awaiting"),
      pending: () => tEl.setAttribute("awaiting", "true"),
      ScrollKey: () => e["ctrlKey"],
      detail: typeof e.detail == "object" ? e.detail : e
    };
  }
  async function PlayPauseOnClicks(e, input) {
    const evt = Event$1(e);
    if (evt.isPending()) {
      return;
    }
    evt.pending();
    const { resolve } = evt;
    const pulse = PulseObj(evt.tEl);
    const click = getClicks1(evt.detail.which);
    const search = await getRelevantWrapperObjFunc1(evt.tEl, input);
    const { lastWrapperInBlock, f_uid, blockExist, root } = search;
    const local = Local(pulse, evt, search, input);
    if (!blockExist) {
      if (click.left || click.right || !f_uid) {
        local.TryToDeactivateSet();
      } else if (click.right) {
        await local.OpenBlockOnCrossRoot();
      }
      return resolve();
    }
    if (click.left || click.right) {
      if (e["altKey"]) {
        await ClickResetWrapper(lastWrapperInBlock(root), {
          "delete-obs-tm": true
        });
      } else if (click.left) {
        await local.tryPlayLastBlock_SimHover(root);
      } else if (click.right) {
        await local.PlayPause_SimHover(root);
      }
      return resolve();
    }
    if (click.right) {
      await local.OpenBlockOnCrossRoot();
    }
    return resolve();
  }
  function SetUpUrlFormatter({
    block,
    targetNode,
    page,
    timestamp,
    startEndComponentMap,
    blockUid
  }, tmSetObj) {
    const { ytGifCmpt, compt2Url, urlBtn, confirmBtns } = fmtTimestampsUrlObj(targetNode);
    urlBtn("url").onclick = async (e) => await OnYtGifUrlBtn2(e, compt2Url);
    urlBtn("yt-gif").onclick = async (e) => await OnYtGifUrlBtn2(e, ytGifCmpt);
    confirmBtns();
    async function OnYtGifUrlBtn2(e, fmtCmpnt_cb) {
      e.preventDefault();
      e.stopPropagation();
      const sel2 = (tm, p) => `[timestamp="${tm}"][timestamp-style="${p}"]`;
      const URL_formatter_settings = {
        block,
        targetNode,
        siblingSel: `[timestamp-style]`,
        selfSel: sel2(timestamp, page),
        getMap: async () => startEndComponentMap,
        isKey: "is component",
        fmtCmpnt_cb,
        tempUID: blockUid,
        from: {
          caster: "timestamp",
          page,
          tmSetObj,
          urlBtn: e.target,
          sel: sel2
        }
      };
      await TryToUpdateBlock_fmt(URL_formatter_settings);
    }
  }
  function Callbacks(o, duration, { validPear }, { lastArr }) {
    const tmSetObj = {
      self: o,
      pear: validPear ? lastArr.find((po) => po != o) ?? null : null
    };
    return {
      async OnClicks(e) {
        await PlayPauseOnClicks(e, { uid: o.tempUID, tmSetObj });
      },
      tryValidateSelf(d) {
        if (duration < 0) {
          return;
        }
        if (duration == d && o.targetNode.hasAttribute("out-of-bounds"))
          return;
        const tm = parseInt(fmtTimestamp("S")(o.timestamp));
        const bounded = tm >= 0 && tm <= duration;
        toggleAttribute(!bounded, "out-of-bounds", o.targetNode);
      },
      tryToAppendUrlBtns() {
        if (!valid_url_formatter())
          return;
        appendVerticalUrlBtns(o.targetNode);
        SetUpUrlFormatter(
          { ...o },
          {
            pear: tmSetObj.pear,
            self: { ...o }
          }
        );
        if (!o.hasAnyVideoUrl) {
          const wrp = o.targetNode.querySelector(
            ".yt-gif-url-btns-wrapper"
          );
          const valid = isSelected(
            UI$1.display.fmt_options,
            "rely_on_hierarchy"
          );
          toggleAttribute(!valid, "style", wrp, "display: none");
          return toggleAttribute(true, "no-url", wrp);
        }
      }
    };
  }
  function AssignCallbacks(o, callbacks) {
    o.targetNode.oncontextmenu = (e) => e.preventDefault();
    const { OnClicks } = callbacks;
    o.targetNode.addEventListener("customMousedown", OnClicks);
    o.targetNode.onmousedown = OnClicks;
    o.targetNode.OnClicks = OnClicks;
    o.targetNode.validateSelf = callbacks.tryValidateSelf;
    o.targetNode.tryToAppendUrlBtns = callbacks.tryToAppendUrlBtns;
    callbacks.tryToAppendUrlBtns();
    o.appendToParent();
  }
  function Checks(o, { lastArr, completePears }) {
    const isTmSet = lastArr.includes(o);
    const validPear = isTmSet && completePears;
    return {
      validPear,
      tryToCollapse() {
        if (isTmSet) {
          o.targetNode.setAttribute(
            "timestamp-set",
            completePears ? "pears" : "single"
          );
        }
      }
    };
  }
  async function TryToDeployTimestampElms(map_successfulEmulationArr) {
    if (map_successfulEmulationArr.size === 0) {
      return;
    }
    const { getDuration } = await durationObj(map_successfulEmulationArr);
    for (const values of map_successfulEmulationArr.values()) {
      for (const ArrObjs of SortEmulationArr(values)) {
        const pears = GetPears(ArrObjs);
        for (const o of ArrObjs) {
          if (!o?.targetNode) {
            continue;
          }
          AssembleTimestampElms(o, pears, getDuration);
        }
      }
    }
  }
  function AssembleTimestampElms(o, pears, getDuration) {
    const check = Checks(o, pears);
    check.tryToCollapse();
    const duration = GetDuration(getDuration(o.blockID));
    const callbacks = Callbacks(o, duration, check, pears);
    callbacks.tryValidateSelf(duration);
    AssignCallbacks(o, callbacks);
  }
  async function cleanAndSetUp_TimestampEmulation(found) {
    const map_successfulEmulationArr = await SetupRerenderedComponents(found);
    await TryToDeployTimestampElms(map_successfulEmulationArr);
  }
  async function toggleTimestampEmulation(bol2, observer, keyupEventHandler) {
    if (bol2)
      await RunEmulation();
    else
      await StopEmulation();
    toggleClasses(
      !bol2,
      [`${cssData.dropdown__hidden}`],
      document.querySelector(".dropdown_timestamp-style")
    );
    async function RunEmulation() {
      await StopEmulation();
      await ToogleTimestampSetUp(true, observer);
      ToggleTimestampShortcuts(
        getOption(UI$1.timestamps.tm_options, "shortcuts").selected,
        keyupEventHandler
      );
    }
    async function StopEmulation() {
      await ToogleTimestampSetUp(false, observer);
      ToggleTimestampShortcuts(false, keyupEventHandler);
    }
  }
  async function ToogleTimestampSetUp(bol2, observer) {
    observer.disconnect();
    const targetNode = document.body;
    if (bol2) {
      const found = Array();
      found.push(
        ...Array.from(
          targetNode.getElementsByClassName(
            timestampObj.start.targetClass
          )
        )
      );
      found.push(
        ...Array.from(
          targetNode.getElementsByClassName(timestampObj.end.targetClass)
        )
      );
      await cleanAndSetUp_TimestampEmulation(found);
      observer.observe(targetNode, {
        childList: true,
        subtree: true
      });
    } else {
      const foundToRemove = targetNode.queryAllasArr(
        `[${timestampObj.attr.emulation}]`
      );
      for (const tm of foundToRemove) {
        const key = tm.getAttribute(timestampObj.attr.timestampStyle) || "timestamp";
        let toReplace = tm.parentElement?.classList.contains(
          "yt-gif-timestamp-parent"
        ) ? tm.parentElement : tm;
        toReplace.innerHTML = key;
        toReplace = ChangeElementType(toReplace, "button");
        toReplace.className = timestampObj[key].buttonClass;
      }
    }
  }
  function ChangeTimestampsDisplay(value) {
    const fmt = fmtTimestamp(value);
    document.queryAllasArr("[yt-gif-timestamp-emulation]").forEach((_tms) => {
      const tms = _tms;
      if (!value)
        return tms.a.textContent = tms.getAttribute("timestamp") ?? tms.a.textContent;
      tms.a.textContent = fmt(tms.a.textContent);
    });
  }
  async function TimestampBtnsMutation_cb(mutationsList) {
    const found = Array();
    for (const { addedNodes } of mutationsList) {
      Array.from(addedNodes).map((nd) => nd).forEach((el) => {
        if (!el.tagName)
          return;
        if (el.classList.contains(timestampObj.start.targetClass) || el.classList.contains(timestampObj.end.targetClass)) {
          found.push(el);
        } else if (el.firstElementChild) {
          found.push(
            ...Array.from(
              el.getElementsByClassName(
                timestampObj.start.targetClass
              )
            )
          );
          found.push(
            ...Array.from(
              el.getElementsByClassName(
                timestampObj.end.targetClass
              )
            )
          );
        }
      });
    }
    await cleanAndSetUp_TimestampEmulation(found);
  }
  function ClearTimestampObserver({ timestampObserver } = window.YT_GIF_OBSERVERS) {
    timestampObserver?.disconnect();
    timestampObserver = new MutationObserver(TimestampBtnsMutation_cb);
    return timestampObserver;
  }
  async function KickstartTimestampObserver({ timestampObserver, keyupEventHandler } = window.YT_GIF_OBSERVERS) {
    await toggleTimestampEmulation(
      UI$1.display.simulate_roam_research_timestamps.checked,
      timestampObserver,
      keyupEventHandler
    );
    UI$1.display.simulate_roam_research_timestamps.addEventListener(
      "change",
      async (e) => toggleTimestampEmulation(
        e.currentTarget.checked,
        timestampObserver,
        keyupEventHandler
      )
    );
    addCustomChangeListener(
      getOption(UI$1.timestamps.tm_options, "shortcuts"),
      (e) => ToggleTimestampShortcuts(e.detail.currentValue, keyupEventHandler)
    );
    UI$1.timestamps.tm_workflow_display.addEventListener(
      "change",
      (e) => ChangeTimestampsDisplay(
        e.currentTarget.value
      )
    );
  }
  function KickStartMasterObserver() {
    rm_components.state.initialKey = rm_components.assertCurrentKey(
      UI$1.defaultValues.override_roam_video_component
    );
    const { initialKey } = rm_components.state;
    rm_components.checkSubDeploymentStyle(initialKey, true);
    rm_components.RunMasterObserverWithKey(initialKey);
  }
  async function LoadHTML() {
    links.html.fetched.playerControls = await fetchTextTrimed(
      links.html.playerControls
    );
    links.html.fetched.urlBtn = await fetchTextTrimed(links.html.urlBtn);
    links.html.fetched.insertOptions = await fetchTextTrimed(
      links.html.insertOptions
    );
    links.html.fetched.anchor = await fetchTextTrimed(links.html.anchor);
    await smart_Load_DDM_onTopbar(links.html.dropDownMenu);
  }
  async function LoadCSS() {
    await smart_LoadCSS(links.css.dropDownMenuStyle, `yt-gif-dropDownMenuStyle`);
    await smart_LoadCSS(links.css.playerStyle, `yt-gif-playerStyle`);
    smart_CssPlayer_UCS(
      window.YT_GIF_DIRECT_SETTINGS.get("player_span")?.sessionValue
    );
  }
  function DDMAction({
    mainDDM,
    mainMenu,
    ddm_focus,
    initialDisplay = "none"
  }) {
    let previousValue = mainDDM.style.display;
    function display(d) {
      return mainDDM.style.display = d;
    }
    function canClose() {
      return !mainDDM.classList.contains(ddm_focus) && !mainMenu.matches(":hover");
    }
    function tryClose() {
      if (canClose())
        mainDDM.queryAllasArr(".dropdown-focus").forEach((el) => el.classList.remove("dropdown-focus"));
      return canClose() ? display("none") : null;
    }
    function open() {
      return display("flex");
    }
    function mutationCallback(mutationList) {
      mutationList.forEach(function(record) {
        if (record.attributeName !== "style") {
          return;
        }
        const { newValue, displayWas, el } = StyleQuery(
          record,
          previousValue
        );
        if (newValue) {
          if (displayWas("flex")) {
            ResetWrappers(mainDDM);
          }
          previousValue = el.style.display;
        }
      });
    }
    display(initialDisplay);
    return { mutationCallback, tryClose, open, close };
  }
  function StyleQuery(record, previousValue) {
    const el = record.target;
    const currentValue = el.style.display;
    const displayWas = (d) => previousValue === d && currentValue !== d;
    const newValue = currentValue !== previousValue;
    return { newValue, displayWas, el };
  }
  function ResetWrappers(mainDDM) {
    return mainDDM.queryAllasArr("iframe").map((el) => el.closest("[data-target]")).filter((el) => el != null).forEach((el) => {
      el?.removeAttribute("class");
      el = RemoveAllChildren(el);
    });
  }
  function RunTutorialsObserver() {
    const { mainDDM, mainMenu, icon } = GetMainYTGIFicon();
    const menu = DDMAction({ mainDDM, mainMenu, ...cssData });
    mainMenu.addEventListener("mouseenter", menu.open);
    mainMenu.addEventListener("mouseleave", menu.tryClose);
    icon.addEventListener("blur", menu.tryClose);
    new MutationObserver(menu.mutationCallback).observe(mainDDM, { attributes: true });
    return { icon, mainDDM };
  }
  async function Ready() {
    ResetMasterObservers();
    await LoadCSS();
    await LoadHTML();
    DDM_to_UI_variables();
    SaveSettingsOnChanges();
    DDMHover();
    FlipBindAttr();
    UpdateOnScroll_RTM(UI$1.range.timestamp_display_scroll_offset);
    UpdateOnScroll_RTM(UI$1.range.end_loop_sound_volume);
    UpdateOnScroll_RTM(UI$1.range.iframe_buffer_slider);
    ToggleThumbnails(getOption(UI$1.experience.xp_options, "thumbnail_as_bg"));
    navigateToSettingsPageInSidebar();
    ToggleTheme();
    initialize_modes_synergy();
    assignFirstAnchorWave();
    SetupAnchorObserver();
    togglePlayPauseStyles();
    await MasterObserver_UCS_RTM();
    KickStartMasterObserver();
    const ddmElmWithListeners = RunTutorialsObserver();
    SetUpSelectTutorials({ ...ddmElmWithListeners, ...cssData });
    SetUpTutorials_smartNotification();
    window.YT_GIF_OBSERVERS.timestampObserver = ClearTimestampObserver();
    await KickstartTimestampObserver();
    const urlObserver = new MutationObserver(InlineUrlBtnMutations_cb);
    ListenForUrlOptions(urlObserver);
    console.log("YT GIF extension activated");
  }
  init();
  async function init() {
    await CreateXload("https://www.youtube.com/player_api");
    if (typeof window.YT == "undefined")
      return console.warn(`The YT GIF Extension won't be installed, major scripts are missing... submit your issue here: ${links.help.github_isuues}`);
    await init$1().then(TryCreateUserInputObject);
    await Ready();
  }
});
//# sourceMappingURL=dev.app.js.map
