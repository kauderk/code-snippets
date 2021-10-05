//verion 21 - semi-refactored
// Load the IFrame Player API code asynchronously.
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/player_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
// there are some funny checkbox combos 
/*-----------------------------------*/
//PERSISTANTE SETTINGS
const InAndOutKeys = {
    ctrlKey: "false",
    shiftKey: "false",
    altKey: "false",
}
/*-----------------------------------*/
const allVideoParameters = new Map();
const lastBlockIDParameters = new Map();
const videoParams = {
    src: "https://www.youtube.com/embed/---------?",
    id: "---------",
    start: 000,
    end: 000,
    speed: 1,
    updateTime: 0,
    volume: 30
};
//
const recordedIDs = new Map();
const sesionIDs = {
    target: null,
    uid: "---------"
}
//
const UI = {
    clipSpanCheck: input(),
    timeStamp: input(),
    referencedTimeStamp: input(),
    exitFullscreenWhenClipEnds: input(),
    hoverInMute: input(),
    strictOneUnmuted: input(),
    playOnHoverBtn: input(),
    playingBtn: input(),
    wheelOffset: input(),
    rangeValue: label()
}
//
const iframeIDprfx = "player_";
let creationCounter = -1;
/*-----------------------------------*/



//once finished, iframe detection will be called every 500ms
let setUP = setInterval(() => {
    if ((typeof window.roam42?.common == 'undefined')) {
        //this is ugly - 
        console.count("activating YT GIF extension | common");
        return;
    }
    if ((typeof (YT) == 'undefined')) {
        console.count("activating YT libraries | common");
        console.count("this is ugly | YT");
        return;
    }
    if (isHTML_AND_InputsSetUP() === true) {
        clearInterval(setUP);
        setInterval(checkVidExist, 500);
    }
}, 500);
function isHTML_AND_InputsSetUP() {
    //arbitrary child to check if custom HTML is attached to the DOM
    if (document.querySelector("#timeStamp") == null) {
        document.querySelector("#app > div > div.roam-app > div.flex-h-box > div.roam-main > div.rm-files-dropzone > div > span:nth-child(8)")
            .insertAdjacentHTML("afterend", `<div class="rm-topbar__spacer-sm"></div>
            <span class="bp3-popover-wrapper">
                <span class="bp3-popover-target">
                    <span class="bp3-popover-wrapper">
                        <span class="bp3-popover-target">
                            <div class="dropdown">
                                <span class="dropbtn bp3-button bp3-minimal bp3-small bp3-icon-more ty-gif-icon">
                                    <svg class="yt-gif-svg" width="24px" height="24px" viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path class="yt-gif-svg-bg-none" fill="none" d="m11 14 7-4-7-4z" />
                                        <path class="yt-gif-svg-bg" d="M4 8H2v12c0 1.103.897 2 2 2h12v-2H4V8z" />
                                        <path class="yt-gif-svg-bg"
                                            d="M20 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-9 12V6l7 4-7 4z" />
                                    </svg>
                                </span>
                                <div class="dropdown-content">
                                    <span class="dropdown-item">
                                        <label for="" title="Seek to last timestamp before editing a block">Previous Time
                                            Stamp</label>
                                        <input type="checkbox" name="" id="timeStamp" checked>
                                    </span>
                                    <span class="dropdown-item">
                                        <label for="" title="Display the clip remaindings and it's duration only">Clip Span
                                            Format</label>
                                        <input type="checkbox" name="" id="clipSpanCheck" checked>
                                    </span>
                                    <span class="dropdown-item">
                                        <label for=""
                                            title="Should use the last timestamp from it's referenced parent">Referenced
                                            Time Stamp</label>
                                        <input type="checkbox" name="" id="referencedTimeStamp" checked>
                                    </span>
                                    <span class="dropdown-item">
                                        <label for="" title="Exit Fullscreen When Clip Ends">Smoll Vid When Big Ends</label>
                                        <input type="checkbox" name="" id="exitFullscreenWhenClipEnds" checked>
                                    </span>
                                    <span class="dropdown-item">
                                        <label for="" title="Play the video without sound when hovering the frame">YT GIF mutted
                                            on mouse over</label>
                                        <input type="checkbox" name="" id="hoverInMute">
                                    </span>
                                    <span class="dropdown-item">
                                        <label for="" title="Maximum of 1 YT GIF to play unmuted at a time">Mute everything
                                            except current</label>
                                        <input type="checkbox" name="" id="strictOneUnmuted" checked>
                                    </span>
                                    <span class="dropdown-item">
                                        <label for="" title="All videos are paused to focus on one at the time">Play On
                                            Hover</label>
                                        <input type="radio" name="playStyle" id="playOnHoverBtn" checked>
                                    </span>
                                    <span class="dropdown-item">
                                        <label for="" title="Loaded videos autoplay and keep on playing">Playing</label>
                                        <input type="radio" name="playStyle" id="playingBtn">
                                    </span>
                                    <span class="dropdown-item rangeOffset">
                                        <input type="range" min="1" max="60" value="1" class="slider" id="wheelOffset">
                                        <label for="" title="Amount of seconds | scroll wheel" id="rangeValue">1</label>
                                    </span>
                                    <div class="dropdown-show-info">
                                        <span class="dropdown-info-message">Show Info</span>
                                        <div class="dropdown-info-box">
                                            <span class="dropdown-info">💡 Hover over the YT GIFs to enable them</span>
                                            <span class="dropdown-info">🗲 While hovering out HOLD the middle mouse 🖱️ button
                                                to keep on playing the YT GIF</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </span>
                        <div class="bp3-overlay bp3-overlay-inline"></div>
                    </span>
                </span>
                <div class="bp3-overlay bp3-overlay-inline"></div>
            </span>`);
    }
    // FINALLY assign all valid dom elements
    else {
        for (let property in UI)
            UI[property] = document.getElementById(property);
        //
        UI.wheelOffset.addEventListener("change", () => UI.rangeValue.innerHTML = UI.wheelOffset.value);
        UI.wheelOffset.addEventListener("wheel", (e) => {
            let dir = Math.sign(e.deltaY) * -1;
            let parsed = parseInt(UI.wheelOffset.value, 10);
            UI.wheelOffset.value = Number(dir + parsed);
            UI.rangeValue.innerHTML = UI.wheelOffset.value;
        });
        //
        UI.rangeValue.innerHTML = UI.wheelOffset.value;
        return true
    }
}
function checkVidExist() {
    let wrappers = document.querySelectorAll(".rm-video-player__container");
    wrappers = inViewport(wrappers);

    for (let i = 0; i < wrappers.length; i++)
        onYouTubePlayerAPIReady(wrappers[i]);

}



/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
//
async function onYouTubePlayerAPIReady(playerWrap) {
    const newId = iframeIDprfx + Number(++creationCounter);

    // uid slicing the last 9 characters form closest blockID
    const uid = playerWrap.closest("span[data-uid]")?.getAttribute("data-uid") ||
        closestBlockID(playerWrap).slice(-9) ||
        closestBlockID(document.querySelector(".bp3-popover-open")).slice(-9);

    //the div that the YTiframe will replace
    playerWrap.className = 'YTwrapper dont-focus-block';
    playerWrap.innerHTML = "";
    playerWrap.insertAdjacentHTML("afterbegin", `<div id="${newId}"></div>
    <div class="YT-controls">
        <div class="theaterModeDiv"></div>
        <div class="YT-clip-time">00:00/00:00</div>
    </div>`);

    //weird recursive function
    const url = await InputBlockVideoParams(uid);
    allVideoParameters.set(newId, urlConfig(url));

    // record a point of reference, mainly for theater mode
    const record = Object.create(sesionIDs);
    sesionIDs.uid = uid;
    const blockID = closestBlockID(playerWrap);
    if (blockID != null)
        recordedIDs.set(blockID, record);

    //ACTUAL CREATION OF THE EMBEDED YOUTUBE VIDEO PLAYER (target)
    return new window.YT.Player(newId, playerConfig());

    //#region local utilites
    async function InputBlockVideoParams(tempUID) {
        let [finalURL, innerUIDs] = await TryToFindURL(tempUID);
        //
        const aliasText = document.querySelector(".bp3-popover-open .rm-alias--block")?.textContent;
        // lucky guy, this block contains a valid url
        if (finalURL && aliasText == null) return finalURL;

        // try on the same block
        for (let i = 0; i < innerUIDs.length; i++) {
            const [pURL, uids] = await TryToFindURL(innerUIDs[i]);
            if (pURL) return pURL;
        }


        for (let i = 0; i < innerUIDs.length; i++) {
            const [pURL, nestedUIDs, pAliases] = await TryToFindURL(innerUIDs[i]);
            //
            for (let j = 0; j < nestedUIDs.length; j++) {
                //
                const [pNestedURL] = await TryToFindURL(nestedUIDs[j]);
                //
                if (pNestedURL && pAliases && pAliases[j] === aliasText)
                    return pNestedURL;
            }
        }
        async function TryToFindURL(desiredUID) {
            const info = await window.roam42.common.getBlockInfoByUID(desiredUID);
            const rawText = info[0][0].string;
            const urls = rawText.match(/(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)\/(watch)?(\?v=)?(\S+)?[^ }]/);
            const innerUIDs = rawText.match(/(?<=\(\()([^(].*?[^)])(?=\)\))/gm);
            const aliases = rawText.match(/(?<=\[)(.*?)(?=\]\(\(\()/gm);
            //if url exist as Array return first index
            return [Array.isArray(urls) ? urls[0] : null, innerUIDs, aliases];
        }
    }
    function urlConfig(url) {
        let success = false;
        const media = Object.create(videoParams);
        if (url.match('https://(www.)?youtube|youtu\.be')) {
            // get ids //url = 'https://www.youtube.com/embed//JD-tF73Lyqo?t=423?end=425';
            const stepOne = url.split('?')[0];
            const stepTwo = stepOne.split('/');
            const videoId = stepTwo[stepTwo.length - 1];

            // get start & end seconds
            const start = /(t=|start=)(?:\d+)/g;
            const startSeconds = extractValue("int", start);
            //
            const end = /(end=)(?:\d+)/g;
            const endSeconds = extractValue("int", end);

            // get playback speed
            const speed = /(s=|speed=)([-+]?\d*\.\d+|\d+)/g;
            const speedFloat = extractValue("float", speed);

            media.src = url;
            media.type = "youtube";
            media.id = videoId;
            media.start = startSeconds;
            media.end = endSeconds;
            media.speed = speedFloat;
            //
            success = true;
        }

        if (success) { return media; }
        else { alert("No valid media id detected"); }
        return false;

        function extractValue(key, regexedValue) {
            let pass;
            let desiredValue;
            let valueCallback = () => { };
            switch (key) {
                case "int":
                    valueCallback = (desiredValue, pass) => {
                        desiredValue = pass[0].match(/\d+/g).map(Number);
                        desiredValue = parseInt(desiredValue);
                        return desiredValue;
                    }
                    break;
                case "float":
                    valueCallback = (desiredValue, pass) => {
                        desiredValue = pass[0].match(/[+-]?\d+(\.\d+)?/g).map(function (v) { return parseFloat(v); });
                        desiredValue = parseFloat(desiredValue);
                        return desiredValue;
                    }
                    break;
            }
            //
            while ((pass = regexedValue.exec(url)) != null) {
                if (pass.index === regexedValue.lastIndex) {
                    regexedValue.lastIndex++;
                }
                desiredValue = valueCallback(desiredValue, pass);
            }
            return desiredValue;
        }
    }
    function playerConfig() {
        let map = allVideoParameters.get(newId);
        return params = {
            height: '100%',
            width: '100%',
            videoId: map?.id,
            playerVars: {
                autoplay: 1, 		// Auto-play the video on load
                controls: 1, 		// Show pause/play buttons in player
                mute: 1,
                start: map?.start,
                end: map?.end,

                vq: 'hd1080',
                version: 3,
                feature: 'oembed',
                autohide: 1, 		// Hide video controls when playing
                showinfo: 0, 		// Hide the video title
                modestbranding: 1,  // Hide the Youtube Logo
                fs: 1,              // Hide the full screen button
                rel: 0,
                cc_load_policy: 3,  // Hide closed captions
                iv_load_policy: 3,  // Hide the Video Annotations
                enablejsapi: 1,
                origin: 'https://roamresearch.com',
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onStateChange
            }
        };
    }
    //#endregion
}
//
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
//
function onPlayerReady(event) {
    const t = event.target;
    const iframe = document.querySelector("#" + t.h.id) || t.getIframe();
    const parent = iframe.parentElement;
    //
    const key = t.h.id;
    const map = allVideoParameters.get(key); //videoParams
    const start = map?.start || 0;
    const end = map?.end || t.getDuration();
    const clipSpan = end - start;
    const speed = map?.speed || 1;
    const tickOffset = 1000 / speed;
    //
    const blockID = closestBlockID(iframe);
    const rocording = recordedIDs.get(blockID);
    //theaterMode 🚧
    if (rocording != null)
        rocording.target = t;

    // store them to cleare them
    t.__proto__.timers = [];
    t.__proto__.isPlaying = true;

    //autostop 🚧
    const loadingMarginOfError = 1; //seconds
    let updateStartTime = start;
    //
    let globalHumanInteraction = false;
    //#region Utilies
    let tick = (target = t) => target?.getCurrentTime();
    let bounded = (x) => start < x && x < end;
    function videoIsPlayingWithSound(boo = true) {
        if (boo)
            t.unMute();
        else
            t.mute();
        togglePlay(boo);
    }
    function togglePlay(bol, playing = true) {
        if (bol && playing) {
            t.__proto__.isPlaying = true;
            t.playVideo();
        }
        else {
            t.__proto__.isPlaying = false;
            t.pauseVideo();
        }
    }
    function anyValidInAndOutKey(e) {
        for (const name in InAndOutKeys) {
            const pass = e[name];
            if (pass) return pass;
        }
        return false;
    }
    //#endregion

    //
    t.setVolume(30);
    iframe.removeAttribute("title");
    t.setPlaybackRate(speed);

    //huh
    const YTcontrols = parent.querySelector("div.YTcontrols");
    const timeDisplay = parent.querySelector("div.YT-clip-time");
    const theaterModeDiv = parent.querySelector("div.theaterModeDiv");

    //#region Loading values 🌿
    // load last sesion values
    if (lastBlockIDParameters.has(blockID)) {
        let sesion = lastBlockIDParameters.get(blockID);
        //
        if (UI.timeStamp?.checked && bounded(sesion.updateTime))
            seekToUpdatedTime(sesion.updateTime);
        //
        t.setVolume(sesion.volume);
    }
    // load referenced values
    else {
        //Future Brand new adition to "lastBlockIDParameters" map
        if (UI.referencedTimeStamp.checked) {
            let players = document.querySelectorAll(`[id*=${iframeIDprfx}]`);
            for (let i = 0; i < players.length; i++) {
                //ignore itself
                if (players[i] === iframe) continue;
                if (players[i]?.src.slice(0, -11) == iframe.src.slice(0, -11)) { //removes at least "widgetid=··" so they reconize each other
                    //
                    const desiredBlockID = blockID || document.querySelector("body > span[blockID]")?.getAttribute("blockID") || closestBlockID(players[i]);
                    //
                    const desiredTarget = recordedIDs.get(desiredBlockID)?.target || t;
                    const desiredTime = tick(desiredTarget) || start;
                    const desiredVolume = desiredTarget?.getVolume();
                    //
                    seekToUpdatedTime(desiredTime)
                    t.setVolume(desiredVolume);
                    console.count(`loaded referenced values to ${key} from ${desiredBlockID}`);
                }
            }
        }
    }
    function seekToUpdatedTime(desiredTime) {
        updateStartTime = desiredTime;
        t.seekTo(updateStartTime);
    }
    // #endregion



    //#region Event Handelers | DDMO stands for "Drop Down Menu Option"
    function InAndOutHoverStatesDDMO(e) {
        //🌿
        if (e.type == "mouseenter") {
            // I'm afraid this event is slower to get attached than 200ms intervals... well 
            globalHumanInteraction = true;
            //
            togglePlay(true);
            // kinda spaguetti code🚧 
            if ((e.buttons == 4 || anyValidInAndOutKey(e)) && UI.strictOneUnmuted.checked) {
                const ytGifs = inViewport(allIframeIDprfx());
                if (ytGifs)
                    for (let i = 0; i < ytGifs.length; i++) {
                        const blockID = closestBlockID(ytGifs[i]);
                        recordedIDs.get(blockID)?.target?.mute();
                    }
            }
            // ...but how else...? 🚧
            if (!UI.hoverInMute.checked)
                t.unMute();
        }
        else if (e.type == "mouseleave") {
            globalHumanInteraction = false;

            togglePlay(!UI.playOnHoverBtn.checked && t.__proto__.isPlaying);
            t.mute();
        }
    }
    function playStyleDDMO() {
        //play all VISIBLE Players
        if (!inViewport(iframe)) return;

        if (UI.playingBtn.checked)
            togglePlay(UI.playingBtn.checked);
        if (UI.playOnHoverBtn.checked)
            togglePlay(!UI.playOnHoverBtn.checked);
    }
    //#endregion


    // #region EventListeners | from DDMO
    // toggle them all it's playing state
    UI.playingBtn.addEventListener("change", playStyleDDMO);
    UI.playOnHoverBtn.addEventListener("change", playStyleDDMO);
    //toggle visuals or sound on hover
    parent.addEventListener("mouseenter", InAndOutHoverStatesDDMO);
    parent.addEventListener("mouseleave", InAndOutHoverStatesDDMO);
    //#endregion




    //#region Event Handelers | Instantiance Interactive Elements
    t.__proto__.timerID;
    t.__proto__.timeDisplayHumanInteraction = false;
    t.__proto__.enter = ContinuouslyUpdateTimeDisplay;
    t.__proto__.ClearTimers = ClearTimers;

    // for the timeDisplay
    function ContinuouslyUpdateTimeDisplay() {
        //🙋
        if (document.querySelector("#" + key) == null) {
            //this is too uggly
            t.__proto__.enter = () => { };
            t.destroy();
            return;
        }
        //🙋
        if (t.__proto__.timeDisplayHumanInteraction === false) return;
        //
        UpdateTimeDisplay();
        t.__proto__.timerID = window.setInterval(() => UpdateTimeDisplay(), tickOffset);
        t.__proto__.timers.push(t.__proto__.timerID);
    }
    function UpdateTimeDisplay() {
        const sec = Math.abs(clipSpan - (end - tick()));
        //console.count(`UpdateTimeDisplay for ${key} with timer -> ${t.__proto__.timerID}`);

        //timeDisplay.innerHTML = "00:00/00:00"
        if (UI.clipSpanCheck.checked) //"sec":"clip end"
            timeDisplay.innerHTML = `${fmtMSS(sec)}/${fmtMSS(clipSpan)}`;
        else //"update":"end"
            timeDisplay.innerHTML = `${fmtMSS(tick())}/${fmtMSS(end)}`;

        function fmtMSS(seconds) {
            const format = val => `0${Math.floor(val)}`.slice(-2);
            const hours = seconds / 3600;
            const minutes = (seconds % 3600) / 60;
            const displayFormat = hours < 1 ? [minutes, seconds % 60] : [hours, minutes, seconds % 60];

            return displayFormat.map(format).join(':');
        }
    }
    function BoundWheelValueToSeek(e) {
        videoIsPlayingWithSound(false);
        //
        let dir = tick() + (Math.sign(e.deltaY) * Math.round(UI.wheelOffset.value) * -1);
        if (dir <= start) dir = end - 1;
        if (dir >= end) dir = start;
        t.seekTo(dir);
        UpdateTimeDisplay();
        //
        setTimeout(() => { //nice delay to show feedback
            if (t.__proto__.timeDisplayHumanInteraction)
                videoIsPlayingWithSound();
        }, tickOffset);
    }
    function HumanInteractionHandeler() {
        t.__proto__.timeDisplayHumanInteraction = true
    }
    // for the parent
    function ResetTrackingValues() {
        t.__proto__.timeDisplayHumanInteraction = false;
        ClearTimers();
    }
    function OptionToKeepPlaying(e) {
        e = e || window.event;

        if (e.buttons == 4 || anyValidInAndOutKey(e))
            videoIsPlayingWithSound();
    }
    // for the timeDisplay | Utilie
    function ClearTimers() {
        window.clearInterval(t.__proto__.timerID);
        t.__proto__.timerID = null;
        //
        if (t.__proto__.timers != []) {
            //
            t.__proto__.timers.forEach(tmr => {
                clearInterval(tmr);
            });
            //
            t.__proto__.timers = [];
        }
    }
    // for the TheaterMode
    function OnTheaterMode(e) {
        e.stopPropagation();
        e.preventDefault();
        if (e.button != 0) return; // left click only 
        //
        theaterMode = !theaterMode;

        const page = iframe.closest(".roam-main") || iframe.closest("#right-sidebar");
        const main = document.querySelector(".roam-main");
        const right = document.querySelector("#right-sidebar");

        const inputB = iframe.closest(".rm-block__input");

        //🚧 🌿
        if (theaterMode) {
            parent.classList.add("YTwrapper-OnTheaterMode");
            inputB.classList.add("YTwrapper-HihgerZIndex");
            page.style
        }
        else {
            parent.classList.remove("YTwrapper-OnTheaterMode");
            inputB.classList.remove("YTwrapper-HihgerZIndex");
            page.classList.remove("YTwrapper-OneHundredPercent");
        }
    }
    //#endregion


    //#region EventListeners | from Elements
    timeDisplay.addEventListener("wheel", BoundWheelValueToSeek);
    timeDisplay.addEventListener("mouseenter", HumanInteractionHandeler);
    timeDisplay.addEventListener("mouseenter", ContinuouslyUpdateTimeDisplay);
    timeDisplay.addEventListener("mouseleave", ResetTrackingValues);
    //
    parent.addEventListener("mouseleave", OptionToKeepPlaying);
    //
    //theaterModeDiv.addEventListener("click", OnTheaterMode);
    // #endregion 






    //#region OnDestroyed | UpdateNextSesionValues | Delete allVideoParameters | removeEventListeners
    let OnDestroyedObserver = new MutationObserver(function (mutations) {
        // check for removed target
        mutations.forEach(function (mutation) {

            const nodes = Array.from(mutation.removedNodes);
            const directMatch = nodes.indexOf(iframe) > -1
            const parentMatch = nodes.some(parent => parent.contains(iframe));

            if (directMatch) {
                console.log('node', iframe, 'was directly removed!');
            } else if (parentMatch) {
                // expensive for sure 🙋
                UI.playingBtn.removeEventListener("change", playStyleDDMO);
                UI.playOnHoverBtn.removeEventListener("change", playStyleDDMO);
                //
                timeDisplay.removeEventListener("wheel", BoundWheelValueToSeek);
                timeDisplay.removeEventListener("mouseenter", HumanInteractionHandeler);
                timeDisplay.removeEventListener("mouseenter", ContinuouslyUpdateTimeDisplay);
                timeDisplay.removeEventListener("mouseleave", ResetTrackingValues);
                //
                //theaterModeDiv.removeEventListener("click", OnTheaterMode);
                //
                parent.removeEventListener("mouseleave", OptionToKeepPlaying);
                parent.removeEventListener("mouseenter", InAndOutHoverStatesDDMO);
                parent.removeEventListener("mouseleave", InAndOutHoverStatesDDMO);

                //🚧
                const media = Object.create(videoParams);
                media.updateTime = bounded(tick()) ? tick() : start;
                media.volume = t.getVolume();

                if (blockID != null)
                    lastBlockIDParameters.set(blockID, media);

                ClearTimers();

                recordedIDs.delete(blockID);
                allVideoParameters.delete(key);

                OnDestroyedObserver.disconnect();

                t.__proto__.enter = () => { };

                //
                const targetExist = document.querySelector("#" + key) == iframe;
                if (targetExist)
                    return console.log(`${key} is displaced not removed thus is not destroyed.`);

                setTimeout(() => {
                    //this is too uggly
                    if (!targetExist) {
                        t.destroy();
                        console.count("Destroyed! " + key);
                    }
                }, 1000);
                const new_element = parent.cloneNode(true);
                parent.parentNode.replaceChild(new_element, parent);
            }
        });
    });

    let config = {
        subtree: true,
        childList: true
    };
    OnDestroyedObserver.observe(document.body, config);
    //#endregion


    // #region pause onOffScreen
    let YscrollObserver = new IntersectionObserver(function (entries) {
        if (!entries[0])
            YscrollObserver.disconnect();

        if (tick() > updateStartTime + loadingMarginOfError && globalHumanInteraction === false) // and the interval function "OneFrame" to prevent the loading black screen
            togglePlay(entries[0]?.isIntersecting, UI.playingBtn.checked);
    }, { threshold: [0] });
    YscrollObserver.observe(iframe);
    //#endregion



    //🚧 🌿
    //#region unMute if referenced |OR| Pause and Avoid black screen loading bar
    let autoplayParent = iframe.closest(".rm-alias-tooltip__content") || //tooltip
        iframe.closest(".bp3-card") || //card
        iframe.closest(".myPortal"); //myPortal

    //simulate hover
    if (autoplayParent) {
        let simHover = new MouseEvent('mouseenter', {
            'view': window,
            'bubbles': true,
            'cancelable': true
        });
        parent.dispatchEvent(simHover);
        t.__proto__.timeDisplayHumanInteraction = false;
    } else { //Freeze
        let OneFrame = setInterval(() => {
            if (tick() > updateStartTime + loadingMarginOfError) {
                //
                if (globalHumanInteraction) {
                    videoIsPlayingWithSound(true);
                }
                else if (inViewport(iframe) && globalHumanInteraction === false)
                    togglePlay(UI.playingBtn.checked);

                clearInterval(OneFrame);
            }
        }, 200);
    }
    //#endregion

}
//
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
//
//loops between "start" and "end" boundaries
function onStateChange(state) {
    let t = state.target;
    let map = allVideoParameters.get(t.h.id);

    if (state.data === YT.PlayerState.ENDED) {
        t.seekTo(map?.start || 0);
        if (UI.exitFullscreenWhenClipEnds.checked)
            exitFullscreen();
    }
    if (state.data === YT.PlayerState.PLAYING) {
        t.__proto__.isPlaying = true;
        //
        if (t.__proto__.timerID === null) // NON ContinuouslyUpdateTimeDisplay
            t.__proto__.enter();
    }
    if (state.data === YT.PlayerState.PAUSED) {
        t.__proto__.isPlaying = false;
        t.__proto__.ClearTimers();
    }
}

//#region Utilies
function inViewport(els) {
    let matches = [],
        elCt = els.length;

    for (let i = 0; i < elCt; ++i) {
        let el = els[i],
            b = el.getBoundingClientRect(),
            c;

        if (b.width > 0 && b.height > 0 &&
            b.left + b.width > 0 && b.right - b.width < window.outerWidth &&
            b.top + b.height > 0 && b.bottom - b.width < window.outerHeight &&
            (c = window.getComputedStyle(el)) &&
            c.getPropertyValue('visibility') === 'visible' &&
            c.getPropertyValue('opacity') !== 'none') {
            matches.push(el);
        }
    }
    return matches;
}

function div(classList) {
    let el = document.createElement('div');
    return emptyEl(classList, el);
}
function input(classList) {
    let el = document.createElement('input');
    return emptyEl(classList, el);
}
function label(classList) {
    let el = document.createElement('label');
    return emptyEl(classList, el);
}

function emptyEl(classList, el) {
    if (classList)
        el.classList.add(classList);
    return el;
}

function exitFullscreen() {
    //if (window.innerHeight == screen.height) return false;
    if (!document.fullscreenElement) return false;
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}
function closestBlockID(el) {
    return el?.closest(".rm-block__input")?.id
}
function allIframeIDprfx() {
    return document.querySelectorAll(`[id*=${iframeIDprfx}]`);
}


function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function cleanUpHTML(content) {
    var dom = document.createElement("div");
    dom.innerHTML = content;
    var elems = dom.getElementsByTagName('*');
    for (var i = 0; i < elems.length; i++) {
        if (elems[i].innerHTML) {
            elems[i].innerHTML = elems[i].innerHTML.trim();
        }
    }
    return dom.innerHTML;
}
//#endregion


