window.YTGIF = {
    /* permutations - checkbox */
    permutations: {
        start_form_previous_timestamp: '1',
        clip_life_span_format: '1',
        referenced_start_timestamp: '1',
    },
    experience: {
        sound_when_video_loops: '1',
    },
    /* permutations - checkbox */
    inactiveStyle: {
        mute_on_inactive_window: '1',
        pause_on_inactive_window: '',
    },
    /* permutations - checkbox */
    fullscreenStyle: {
        smoll_vid_when_big_ends: '1',
        mute_on_exit_fullscreenchange: '',
        pause_on_exit_fullscreenchange: '',
    },
    /* one at a time - radio */
    muteStyle: {
        strict_mute_everything_except_current: '1',
        muted_on_mouse_over: '',
        muted_on_any_mouse_interaction: '',
    },
    /* one at a time - radio */
    playStyle: {
        strict_current_play_on_mouse_over: '1',
        play_on_mouse_over: '',
        visible_clips_start_to_play_unmuted: '',
    },
    range: {
        /*seconds up to 60*/
        wheelOffset: '5',
    },
    InAndOutKeys: {
        /* middle mouse button is on by default */
        ctrlKey: '1',
        shiftKey: '',
        altKey: '',
    },
    default: {
        video_volume: 40,
        /* 'dark' or 'light' */
        yt_gif_drop_down_menu_theme: 'dark',
        /* empty means 50% - only valid css units like px  %  vw */
        player_span: '50%',
        /* distinguish between {{[[video]]:}} from {{[[yt-gif]]:}} or 'both' which is also valid*/
        override_roam_video_component: '',
        /* src sound when yt gif makes a loop, empty if unwanted */
        clip_end_sound: 'https://freesound.org/data/previews/256/256113_3263906-lq.mp3',
    },
}
//- Hello? 10
// version 27 - semi-refactored
// Load the IFrame Player API.
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/player_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


/*-----------------------------------*/
/* USER SETTINGS  */
const UI = window.YTGIF;
/* user doesn't need to see this */
UI.label = {
    rangeValue: ''
}
UI.deploymentStyle = {
    suspend_yt_gif_deployment: '',

    deployment_style_yt_gif: '1',
    deployment_style_video: '',
    deployment_style_both: '',

    deploy_yt_gifs: '',
}
/*-----------------------------------*/
const iframeIDprfx = 'player_';
let creationCounter = -1;
let currentFullscreenPlayer = '';
let MasterMutationObservers = [];
let MasterIntersectionObservers = [];
/*-----------------------------------*/
const allVideoParameters = new Map();
const lastBlockIDParameters = new Map();
const videoParams = {
    src: 'https://www.youtube.com/embed/---------?',
    id: '---------',
    start: 0,
    end: 0,
    speed: 1,
    updateTime: 0,
    volume: UI.default.video_volume
};
//
const recordedIDs = new Map();
const sesionIDs = {
    target: null,
    uid: '---------'
}
/*-----------------------------------*/
function URLFolder(f)
{
    return `https://kauderk.github.io/code-snippets/yt-gif-extension/${f}`
};
const links = {
    css: {
        dropDownMenu: URLFolder('drop-down-menu.css'),
        player: URLFolder('player.css'),
        themes: {
            dark_dropDownMenu: URLFolder('themes/dark-drop-down-menu.css'),
            light_dropDownMenu: URLFolder('themes/light-drop-down-menu.css'),
        }
    },
    html: {
        dropDownMenu: URLFolder('drop-down-menu.html'),
        playerControls: URLFolder('player-controls.html'),
        fetched: {
            playerControls: '',
        },
    },
    js: {
        main: URLFolder('yt-gif-main.js')
    }
}
const cssData = {
    yt_gif: 'yt-gif',
    yt_gif_wrapper: 'yt-gif-wrapper',
    yt_gif_iframe_wrapper: 'yt-gif-iframe-wrapper',
    yt_gif_timestamp: 'yt-gif-timestamp',
    yt_gif_audio: 'yt-gif-audio',
    ty_gif_custom_player_span_first_usage: 'ty-gif-custom-player-span-first-usage',

    dropdown_not_allowed_input: 'dropdown_not-allowed_input',
    dropdown_fadeIt_bg_animation: 'dropdown_fadeIt-bg_animation',
    dropdown_forbidden_input: 'dropdown_forbidden-input',
    dropdown_allright_input: 'dropdown_allright-input',
    dropdown__hidden: 'dropdown--hidden',
    dropdown_deployment_style: 'dropdown_deployment-style',
}
/*-----------------------------------*/
const ytGifAttr = {
    sound: {
        mute: 'yt-mute',
        unMute: 'yt-unmute'
    },
    play: {
        playing: 'yt-playing',
        paused: 'yt-paused'
    },
    extra: {
        readyToEnable: 'readyToEnable'
    }
}
/*-----------------------------------*/
const observeEls = {
    yt_gif: `rm-xparser-default-${cssData.yt_gif}`,
    video: 'rm-video-player__spacing-wrapper'
}
/*-----------------------------------*/




// wait for APIs to exist
const almostReady = setInterval(() =>
{
    if ((typeof (YT) == 'undefined'))
    {
        return;
    }
    clearInterval(almostReady);
    Ready(); // load dropdown menu and deploy iframes

}, 500);

async function Ready()
{
    // 1.
    await LoadCSS(links.css.dropDownMenu);
    await LoadCSS(links.css.player);

    // 2.
    await deal_with_visual_user_custimizations();
    await load_html_player_attrs();

    // 3. 
    await load_html_drop_down_menu();

    // 4. assign the User Inputs (UI) to their variables
    drop_down_menu_inputs_as_variables();

    // 5. One time - the timestamp scroll offset updates on changes
    timestamp_offset_features();

    // 6.
    while_running_features();

    // 7. is nice to have an option to stop the masterObserver for good
    what_components_to_observe_and_deploy();

    console.log('YT GIF extension activated');

    //#region hidden functions
    async function deal_with_visual_user_custimizations()
    {
        if (UI.default.yt_gif_drop_down_menu_theme === 'dark')
            await LoadCSS(links.css.themes.dark_dropDownMenu);

        else
            await LoadCSS(links.css.themes.light_dropDownMenu);

        if (isValidCSSUnit(UI.default.player_span))
        {
            const css_rule = `.${cssData.yt_gif_wrapper}, .${cssData.yt_gif_iframe_wrapper} {
                width: ${UI.default.player_span};
            }`;
            const id = `${cssData.ty_gif_custom_player_span}-${UI.default.player_span}`
            create_css_rule(css_rule, id);
            //#region util
            function create_css_rule(css_rules = 'starndard css rules', id = `${cssData.yt_gif}-custom`)
            {
                const style = document.createElement('style');
                style.id = id;
                style.setAttribute('type', 'text/css');
                style.innerHTML = css_rules;
                document.getElementsByTagName('head')[0].appendChild(style);
            }
            //#endregion
        }
    }

    async function load_html_drop_down_menu()
    {
        const moreIcon = document.querySelector('.bp3-icon-more').closest('.rm-topbar .rm-topbar__spacer-sm + .bp3-popover-wrapper');
        const htmlText = await FetchText(links.html.dropDownMenu);
        moreIcon.insertAdjacentHTML('afterend', htmlText);
    }

    async function load_html_player_attrs()
    {
        let htmlText = await FetchText(links.html.playerControls);
        if (UI.default.clip_end_sound != '')
        {
            htmlText = htmlText.replace(/(?<=<source src=\")(?=")/gm, UI.default.clip_end_sound);
        }
        links.html.fetched.playerControls = htmlText;
        return htmlText
    }

    function drop_down_menu_inputs_as_variables()
    {
        // this took a solid hour. thak you thank you
        for (const parentKey in UI)
        {
            for (const childKey in UI[parentKey])
            {
                const userValue = UI[parentKey][childKey];
                const domEl = document.getElementById(childKey);
                //don't mess up any other variable
                if (domEl)
                    UI[parentKey][childKey] = domEl;

                switch (parentKey)
                {
                    case 'permutations':
                    case 'deploymentStyle':
                    case 'experience':
                    case 'inactiveStyle':
                    case 'fullscreenStyle':
                    case 'muteStyle':
                    case 'playStyle':
                        const binaryInput = UI[parentKey][childKey];
                        binaryInput.checked = isTrue(userValue);
                        binaryInput.previousElementSibling.setAttribute('for', binaryInput.id);
                        break;
                    case 'range':
                        UI[parentKey][childKey].value = Number(userValue);
                        break;
                    case 'label':
                        UI[parentKey][childKey].innerHTML = userValue;
                        break;
                }
            }
        }
    }

    function timestamp_offset_features()
    {
        UI.range.wheelOffset.addEventListener('change', () => UpdateRangeValue());
        UI.range.wheelOffset.addEventListener('wheel', (e) =>
        {
            const dir = Math.sign(e.deltaY) * -1;
            const parsed = parseInt(UI.range.wheelOffset.value, 10);
            UI.range.wheelOffset.value = Number(dir + parsed);
            UpdateRangeValue();
        });
        UpdateRangeValue();

        //#region  local utils
        function UpdateRangeValue()
        {
            UI.label.rangeValue.innerHTML = UI.range.wheelOffset.value;
        }
        //#endregion
    }

    function while_running_features()
    {
        //ﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠ// UI.deploymentStyle.suspend_yt_gif_deployment
        const menuDeployCheckbox = UI.deploymentStyle.suspend_yt_gif_deployment;
        menuDeployCheckbox.addEventListener('change', handleMenuDeploy);

        const label = menuDeployCheckbox.previousElementSibling;
        const info = {
            suspend: 'Suspend YT GIF deployment',
            deploy: 'Deploy with customizations',
            loading: 'loading',
        }
        label.innerHTML = info.suspend;
        const islabel = (str) => label.innerHTML == str;

        label.setAttribute('for', menuDeployCheckbox.id); // link checks

        const submenuSubmit = UI.deploymentStyle.deploy_yt_gifs;
        submenuSubmit.addEventListener('change', handleSubMenuDeploy);


        const hiddenDeploySubMenu = document.querySelector(`.${cssData.dropdown__hidden}.${cssData.dropdown_deployment_style}`);

        function handleMenuDeploy(e)
        {
            if (menuDeployCheckbox.checked)
            {
                if (islabel(info.suspend))
                {
                    isSubMenuHidden(false);
                    label.innerHTML = info.deploy;

                    console.count('clean observers')
                }
                else if (islabel(info.deploy))
                {
                    isSubMenuHidden(true);
                    label.innerHTML = info.suspend;

                    console.count('new observers')
                }
            }
            menuDeployCheckbox.checked = false;
            console.count('clicks');

            isMenuCheckboxDisabled(true); //don't spam it
            setTimeout(() => isMenuCheckboxDisabled(false), 10000);
        }

        function handleSubMenuDeploy(e)
        {
            if (submenuSubmit.checked && (islabel(info.deploy)))
            {
                isSubMenuHidden(true);
                label.innerHTML = info.suspend;
                submenuSubmit.checked = false;

                console.log('deploy form submenu' + e);
            }
        }

        //#region utils
        function isMenuCheckboxDisabled(bol)
        {
            menuDeployCheckbox.disabled = bol;
            const classNamesCheckbox = [cssData.dropdown_not_allowed_input, cssData.dropdown_fadeIt_bg_animation, cssData.dropdown_forbidden_input]
            toggleClasses(bol, classNamesCheckbox, menuDeployCheckbox.parentElement);

            const classNameslabel = [cssData.dropdown_not_allowed_input]
            toggleClasses(bol, classNameslabel, label);

            console.log({ menuDeployCheckbox: () => menuDeployCheckbox.disabled });
        }

        function isSubMenuHidden(bol)
        {
            const classNames = [`${cssData.dropdown__hidden}`]
            toggleClasses(bol, classNames, hiddenDeploySubMenu);
        }

        function toggleClasses(bol, classNames, el)
        {
            if (bol)
            {
                el.classList.add(...classNames);
            }

            else
            {
                el.classList.remove(...classNames);
            }
        }
        //#endregion
    }

    function what_components_to_observe_and_deploy()
    {
        if (isTrue(UI.default.override_roam_video_component)) //video
        {
            MasterMutationObservers.push(ObserveIframesAndDelployYTPlayers(observeEls.video));
        }
        else if (UI.default.override_roam_video_component === 'both') //observeEls values
        {
            for (const key in observeEls)
            {
                MasterMutationObservers.push(ObserveIframesAndDelployYTPlayers(observeEls[key]));
            }
        }
        else // yt-gif
        {
            MasterMutationObservers.push(ObserveIframesAndDelployYTPlayers(observeEls.yt_gif));
        }
    }

    //#endregion

    //#region uitils
    async function LoadCSS(cssURL) // 'cssURL' is the stylesheet's URL, i.e. /css/styles.css
    {
        if (await !isValidFetch(cssURL)) return;

        return new Promise(function (resolve, reject)
        {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssURL;
            document.head.appendChild(link);

            link.onload = () => resolve();
        });
    }

    //#endregion
}

function ObserveIframesAndDelployYTPlayers(targetClass)
{
    // 1. set up all visible YT GIFs
    const visible = inViewport(AvoidAllZoomChilds());
    for (const component of visible)
    {
        onYouTubePlayerAPIReady(component, 'first wave');
    }

    // 2. IntersectionObserver attached to deploy when visible
    const hidden = AvoidAllZoomChilds();
    for (const component of hidden)
    {
        ObserveIntersectToSetUpPlayer(component, 'second wave'); // I'm quite impressed with this... I mean...
    }

    // 3. ready to observe and deploy iframes
    const targetNode = document.querySelector('body');
    const config = { childList: true, subtree: true };
    const observer = new MutationObserver(mutation_callback);
    observer.observe(targetNode, config);

    return observer

    //#region observer utils
    function ObserveIntersectToSetUpPlayer(iterator, message = 'YscrollObserver')
    {
        const yobs = new IntersectionObserver(Intersection_callback, { threshold: [0] });

        function Intersection_callback(entries)
        {
            if (!entries[0])
                yobs.disconnect();

            for (const entry of entries)
            {
                if (entry.isIntersecting)
                {
                    onYouTubePlayerAPIReady(iterator, message);
                    yobs.disconnect();
                    break;
                }
            }
        }

        yobs.observe(iterator);

        return yobs;
    }
    // ObserveIntersectToSetUpPlayer when cssClass is added to the DOM
    function mutation_callback(mutationsList, observer)
    {
        const found = [];
        for (const { addedNodes } of mutationsList)
        {
            for (const node of addedNodes)
            {
                if (!node.tagName) continue; // not an element

                if (node.classList.contains(targetClass))
                {
                    found.push(node);
                }
                else if (node.firstElementChild)
                {
                    // javascript is crazy and i don't get how or what this is doing... man...
                    found.push(...node.getElementsByClassName(targetClass));
                }
            }
        }
        for (const node of found)
        {
            if (isNotZoomPath(node))
                ObserveIntersectToSetUpPlayer(node, 'valid entries MutationObserver');
        }
    };
    //#endregion

    //#region local utils
    function AvoidAllZoomChilds()
    {
        const components = Array.from(document.querySelectorAll('.' + targetClass));
        //valids
        return components.filter(el => isNotZoomPath(el));
    }
    function isNotZoomPath(el)
    {
        return !el.closest("[class*='rm-zoom']");
    }
    //#endregion
}







/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
//
async function onYouTubePlayerAPIReady(wrapper, message = 'I dunno')
{
    if (!wrapper) return;

    // 1. last 9 letter form the closest blockID
    const uid = wrapper.closest('span[data-uid]')?.getAttribute('data-uid') ||
        closestBlockID(wrapper)?.slice(-9) ||
        closestBlockID(document.querySelector('.bp3-popover-open'))?.slice(-9);

    if (!uid) return; // don't add up false positives
    const newId = iframeIDprfx + Number(++creationCounter);



    // 2. the div that the YTiframe will replace
    if (wrapper.tagName != 'DIV')
    {
        wrapper = ChangeElementType(wrapper, 'div');
    }
    wrapper.parentElement.classList.add(`${cssData.yt_gif_wrapper}-parent`);
    wrapper.className = `${cssData.yt_gif_wrapper} dont-focus-block`;
    wrapper.innerHTML = '';
    let htmlText = links.html.fetched.playerControls;
    htmlText = htmlText.replace(/(?<=<audio id=\").*(?=")/gm, `${cssData.yt_gif_audio}-${uid}`);
    wrapper.insertAdjacentHTML('afterbegin', htmlText);
    wrapper.querySelector('.yt-gif-player').id = newId;



    // 3. weird recursive function... guys...
    const url = await InputBlockVideoParams(uid);
    allVideoParameters.set(newId, urlConfig(url));



    // 4. to record a target's point of reference
    const record = Object.create(sesionIDs);
    sesionIDs.uid = uid;
    const blockID = closestBlockID(wrapper);
    if (blockID != null)
        recordedIDs.set(blockID, record);



    //console.count(message);

    // 5. ACTUAL CREATION OF THE EMBEDED YOUTUBE VIDEO PLAYER (target)
    return new window.YT.Player(newId, playerConfig());

    //#region local utilites
    async function InputBlockVideoParams(tempUID)
    {
        const [finalURL, innerUIDs] = await TryToFindURL(tempUID);
        //
        const aliasText = document.querySelector('.bp3-popover-open .rm-alias--block')?.textContent;
        // lucky guy, this block contains a valid url
        if (finalURL && aliasText == null) return finalURL;

        // try on the same block
        for (const i of innerUIDs)
        {
            const [pURL, uids] = await TryToFindURL(i);
            if (pURL) return pURL;
        }

        // ok so... the recursive youtube class didn't quite register... don't look at me.

        for (const i of innerUIDs)
        {
            const [pURL, nestedUIDs, pAliases] = await TryToFindURL(i);

            for (const j of nestedUIDs)
            {
                const [pNestedURL] = await TryToFindURL(j);
                if (pNestedURL && pAliases && pAliases[j] === aliasText)
                    return pNestedURL;
            }
        }

        async function TryToFindURL(desiredUID)
        {
            // const info42 = await window.roam42.common.getBlockInfoByUID(desiredUID);
            const info = await window.roamAlphaAPI.q(`[:find (pull ?b [:block/string]):where [?b :block/uid "${desiredUID}"]]`);
            const rawText = info[0][0].string;
            const urls = rawText.match(/(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)\/(watch)?(\?v=)?(\S+)?[^ }]/);
            const innerUIDs = rawText.match(/(?<=\(\()([^(].*?[^)])(?=\)\))/gm);
            const aliases = rawText.match(/(?<=\[)(.*?)(?=\]\(\(\()/gm);
            //if url exist as Array return first index    //         //
            return [Array.isArray(urls) ? urls[0] : null, innerUIDs, aliases];
        }
    }
    function urlConfig(url)
    {
        let success = false;
        const media = Object.create(videoParams);
        if (url.match('https://(www.)?youtube|youtu\.be'))
        {
            // get ids //url = 'https://www.youtube.com/embed//JD-tF73Lyqo?t=413?end=435';
            const stepOne = url.split('?')[0];
            const stepTwo = stepOne.split('/');
            const videoId = stepTwo[stepTwo.length - 1];

            // get start & end seconds
            const start = /(t=|start=)(?:\d+)/g;
            const startSeconds = ExtractFromURL('int', start);
            //
            const end = /(end=)(?:\d+)/g;
            const endSeconds = ExtractFromURL('int', end);

            // get playback speed
            const speed = /(s=|speed=)([-+]?\d*\.\d+|\d+)/g;
            const speedFloat = ExtractFromURL('float', speed);

            // get volume
            const volume = /(vl=)(?:\d+)/g;
            const volumeInt = ExtractFromURL('int', volume);


            media.src = url;
            media.type = 'youtube';
            media.id = videoId;
            media.start = startSeconds;
            media.end = endSeconds;
            media.speed = speedFloat;
            media.volume = volumeInt;
            //
            success = true;

            //#region util
            function ExtractFromURL(key, regexedValue)
            {
                let pass;
                let desiredValue;
                let valueCallback = () => { };
                switch (key)
                {
                    case 'int':
                        valueCallback = (desiredValue, pass) =>
                        {
                            desiredValue = pass[0].match(/\d+/g).map(Number);
                            desiredValue = parseInt(desiredValue);
                            return desiredValue;
                        }
                        break;
                    case 'float':
                        valueCallback = (desiredValue, pass) =>
                        {
                            desiredValue = pass[0].match(/[+-]?\d+(\.\d+)?/g).map(function (v) { return parseFloat(v); });
                            desiredValue = parseFloat(desiredValue);
                            return desiredValue;
                        }
                        break;
                }
                //
                while ((pass = regexedValue.exec(url)) != null)
                {
                    if (pass.index === regexedValue.lastIndex)
                    {
                        regexedValue.lastIndex++;
                    }
                    desiredValue = valueCallback(desiredValue, pass);
                }
                return desiredValue;
            }
            //#endregion
        }

        if (success) { return media; }
        else { alert('No valid media id detected'); }
        return false;
    }
    function playerConfig()
    {
        const map = allVideoParameters.get(newId);
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
function onPlayerReady(event)
{
    const t = event.target;
    const iframe = document.querySelector('#' + t.h.id) || t.getIframe();
    const parent = iframe.closest('.' + cssData.yt_gif_wrapper) || iframe.parentElement;
    //
    const key = t.h.id;
    const map = allVideoParameters.get(key); //videoParams
    const start = map?.start || 0;
    const end = map?.end || t.getDuration();
    const clipSpan = end - start;
    const speed = map?.speed || 1;
    const volume = validVolume();
    const tickOffset = 1000 / speed;
    //
    const blockID = closestBlockID(iframe);
    const rocording = recordedIDs.get(blockID);
    // 🚧?
    if (rocording != null)
        rocording.target = t;

    //autostop 🚧
    const loadingMarginOfError = 1; //seconds
    let updateStartTime = start;

    // javascript is crazy
    t.__proto__.timers = [];
    t.__proto__.timerID;
    t.__proto__.ClearTimers = ClearTimers;
    t.__proto__.enter = ContinuouslyUpdateTimeDisplay;
    t.__proto__.globalHumanInteraction = undefined;
    t.__proto__.timeDisplayHumanInteraction = false;


    iframe.removeAttribute('title');
    t.setVolume(volume);
    t.setPlaybackRate(speed);


    const timeDisplay = parent.querySelector('div.' + cssData.yt_gif_timestamp);

    //#region Loading values 🌿
    // load last sesion values
    if (lastBlockIDParameters.has(blockID))
    {
        const sesion = lastBlockIDParameters.get(blockID);

        if (UI.permutations.start_form_previous_timestamp?.checked && bounded(sesion.updateTime))
            seekToUpdatedTime(sesion.updateTime);

        t.setVolume(sesion.volume);
    }
    // load referenced values
    else
    {
        //Future Brand new adition to 'lastBlockIDParameters' map
        if (UI.permutations.referenced_start_timestamp.checked)
        {
            const ytGifs = allIframeIDprfx();
            for (const i of ytGifs)
            {
                if (i === iframe) continue; //ignore itself

                if (i?.src?.slice(0, -11) == iframe?.src?.slice(0, -11))
                { //removes at least 'widgetid=··' so they reconize each other

                    const desiredBlockID = blockID || document.querySelector('body > span[blockID]')?.getAttribute('blockID') || closestBlockID(i);

                    const desiredTarget = recordedIDs.get(desiredBlockID)?.target || t;
                    const desiredTime = tick(desiredTarget) || start;
                    const desiredVolume = desiredTarget?.getVolume() || validVolume();

                    seekToUpdatedTime(desiredTime)

                    if ((typeof (desiredTarget.__proto__.globalHumanInteraction) != 'undefined'))
                    {
                        t.setVolume(desiredVolume);
                    }
                    const saveMessage = stringWithNoEmail(desiredBlockID);
                    console.count(`${key} referenced from ${saveMessage}`);
                    break;
                    //#region local util
                    function stringWithNoEmail(myString)
                    {
                        if (myString.search(/([^.@\s]+)(\.[^.@\s]+)*@([^.@\s]+\.)+([^.@\s]+)/) !== -1)
                        {
                            // There is an email! Remove it...
                            myString = myString.replace(/([^.@\s]+)(\.[^.@\s]+)*@([^.@\s]+\.)+([^.@\s]+)/, "");
                        }
                        return myString
                    }
                    //#endregion
                }
            }
        }
    }


    function seekToUpdatedTime(desiredTime)
    {
        updateStartTime = desiredTime;
        t.seekTo(updateStartTime);
    }
    // #endregion



    //#region Event Handelers | DDMO stands for 'Drop Down Menu Option'
    function InAndOutHoverStatesDDMO(e)
    {
        //🌿
        if (e.type == 'mouseenter')
        {
            t.__proto__.globalHumanInteraction = true; // I'm afraid this event is slower to get attached than 200ms intervals... well 

            togglePlay(true);



            // kinda spaguetti code🚧 
            if (UI.muteStyle.strict_mute_everything_except_current.checked)
            {
                if (anyValidInAndOutKey(e))
                {
                    function muteWithBlock(id, el)
                    {
                        SoundIs(ytGifAttr.sound.mute, el);
                        recordedIDs.get(id)?.target?.mute();
                    }

                    const config = {
                        styleQuery: ytGifAttr.sound.unMute,
                        self_callback: (id, el) => muteWithBlock(id, el),
                        others_callback: (id, el) => muteWithBlock(id, el)
                    }

                    LoopTroughVisibleYTGIFs(config);
                }
            }
            if (UI.playStyle.strict_current_play_on_mouse_over.checked)
            {
                const config = {
                    styleQuery: ytGifAttr.play.playing,
                    others_callback: (id, el) =>
                    {
                        PlayIs(ytGifAttr.play.paused, el);
                        recordedIDs.get(id)?.target?.pauseVideo()
                    }
                }
                LoopTroughVisibleYTGIFs(config);
            }
            // ...but how else...? 🚧



            if (CanUnmute())
            {
                isSoundingFine();
            }
            else if (UI.muteStyle.muted_on_mouse_over.checked)
            {
                isSoundingFine(false);
            }

            //#region local utils
            function LoopTroughVisibleYTGIFs(config = { styleQuery, others_callback: () => { }, self_callback: () => { } })
            {
                const ytGifs = inViewport(allIframeStyle(config?.styleQuery));
                for (const i of ytGifs)
                {
                    const blockID = closestBlockID(i);
                    if (i != iframe)
                    {
                        config?.others_callback(blockID, i);
                    }
                    else if (config.BlockID_self_callback)
                    {
                        config?.self_callback(blockID, i);
                    }
                }
            }
            //#endregion
        }
        else if (e.type == 'mouseleave')
        {
            t.__proto__.globalHumanInteraction = false;

            //ﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠ//the same as: if it's true, then the other posibilities are false
            if (anyValidInAndOutKey(e) && !UI.muteStyle.muted_on_any_mouse_interaction.checked)
            {
                videoIsPlayingWithSound();
            }
            else
            {
                //ﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠﾠ// playing
                togglePlay(!AnyPlayOnHover() && (t.getPlayerState() === 1));

                isSoundingFine(false);
            }
        }
    }


    function playStyleDDMO()
    {
        if (!inViewport(iframe)) return; //play all VISIBLE Players, this will be called on all visible iframes

        if (UI.playStyle.visible_clips_start_to_play_unmuted.checked)
        {
            togglePlay(true);
            isSoundingFine(false);
        }
        else if (AnyPlayOnHover())
        {
            togglePlay(!AnyPlayOnHover());
        }
    }

    function muteStyleDDMO()
    {
        if (!inViewport(iframe)) return; //mute all VISIBLE Players, this will be called on all visible iframes

        if (UI.muteStyle.strict_mute_everything_except_current.checked || UI.muteStyle.muted_on_any_mouse_interaction.checked)
        {
            isSoundingFine(false);
        }
    }
    //#endregion


    // #region EventListeners | from DDMO
    for (const p in UI.playStyle)
    {
        UI.playStyle[p].addEventListener('change', playStyleDDMO); // all valid, toggle play state
    }
    for (const m in UI.muteStyle)
    {
        UI.muteStyle[m].addEventListener('change', muteStyleDDMO); // all valid, toggle play state
    }
    //toggle visuals or sound on hover
    parent.addEventListener('mouseenter', InAndOutHoverStatesDDMO);
    parent.addEventListener('mouseleave', InAndOutHoverStatesDDMO);
    //#endregion




    //#region Event Handelers | Instantiance Interactive Elements
    // for the timeDisplay
    function ContinuouslyUpdateTimeDisplay()
    {
        //🙋 this is too uggly
        if (document.querySelector('#' + key) == null)
        {
            t.__proto__.enter = () => { };
            t.destroy();
            return;
        }
        //🙋
        if (t.__proto__.timeDisplayHumanInteraction === false) return;


        UpdateTimeDisplay();

        t.__proto__.timerID = window.setInterval(() => UpdateTimeDisplay(), tickOffset);
        t.__proto__.timers.push(t.__proto__.timerID);

    }
    function UpdateTimeDisplay()
    {
        const sec = Math.abs(clipSpan - (end - tick()));

        //timeDisplay.innerHTML = '00:00/00:00'
        if (UI.permutations.clip_life_span_format.checked) 
        {
            timeDisplay.innerHTML = `${fmtMSS(sec)}/${fmtMSS(clipSpan)}`; //'sec':'clip end'
        }
        else
        {
            timeDisplay.innerHTML = `${fmtMSS(tick())}/${fmtMSS(end)}`; //'update':'end'
        }

        //#region util
        function fmtMSS(seconds)
        {
            const format = val => `0${Math.floor(val)}`.slice(-2);
            const hours = seconds / 3600;
            const minutes = (seconds % 3600) / 60;
            const displayFormat = hours < 1 ? [minutes, seconds % 60] : [hours, minutes, seconds % 60];

            return displayFormat.map(format).join(':');
        }
        //#endregion
    }

    function BoundWheelValueToSeek(e)
    {
        videoIsPlayingWithSound(false);

        let dir = tick() + (Math.sign(e.deltaY) * Math.round(UI.range.wheelOffset.value) * -1);
        if (UI.permutations.clip_life_span_format.checked)
        {
            if (dir <= start)
                dir = end - 1;

            if (dir >= end)
                dir = start;
        }

        t.seekTo(dir);
        UpdateTimeDisplay();

        setTimeout(() =>
        {
            if (t.__proto__.timeDisplayHumanInteraction)
            {
                videoIsPlayingWithSound();
            }
        }, tickOffset); //nice delay to show feedback
    }

    function HumanInteractionHandeler()
    {
        t.__proto__.timeDisplayHumanInteraction = true
    }

    // for the parent
    function ResetTrackingValues()
    {
        t.__proto__.timeDisplayHumanInteraction = false;
        ClearTimers();
    }
    // for the timeDisplay | Utilie
    function ClearTimers()
    {
        window.clearInterval(t.__proto__.timerID);
        t.__proto__.timerID = null;

        if (t.__proto__.timers != [])
        {
            for (const tmr of t.__proto__.timers)
            {
                clearInterval(tmr);
            }

            t.__proto__.timers = [];
        }
    }

    //#endregion


    //#region EventListeners | from Elements
    timeDisplay.addEventListener('wheel', BoundWheelValueToSeek);
    timeDisplay.addEventListener('mouseenter', HumanInteractionHandeler);
    timeDisplay.addEventListener('mouseenter', ContinuouslyUpdateTimeDisplay);
    timeDisplay.addEventListener('mouseleave', ResetTrackingValues);
    // #endregion 

    //#region detect fullscreen mode
    iframe.addEventListener('fullscreenchange', () =>
    {
        currentFullscreenPlayer = t.h.id;

        if (!document.fullscreenElement)
        {
            if (UI.fullscreenStyle.mute_on_exit_fullscreenchange.checked)
            {
                isSoundingFine(false);
            }
            if (UI.fullscreenStyle.pause_on_exit_fullscreenchange.checked)
            {
                togglePlay(false);
            }
        }
    });
    //#endregion


    const withEventListeners = [parent, parent.parentNode, timeDisplay, iframe];

    //#region OnDestroyed | UpdateNextSesionValues | Delete allVideoParameters | removeEventListeners
    const OnDestroyedObserver = new MutationObserver(function (mutationsList)
    {
        // check for removed target
        mutationsList.forEach(function (mutation)
        {
            const nodes = Array.from(mutation.removedNodes);
            const directMatch = nodes.indexOf(iframe) > -1
            const parentMatch = nodes.some(parent => parent.contains(iframe));

            if (directMatch)
            {
                console.log('node', iframe, 'was directly removed!');
            }
            else if (parentMatch)
            {
                // expensive for sure 🙋
                for (const el of withEventListeners)
                {
                    el.replaceWith(el.cloneNode(true));
                }
                for (const p in UI.playStyle)
                {
                    UI.playStyle[p].removeEventListener('change', playStyleDDMO); // all valid, toggle play state
                }
                for (const m in UI.muteStyle)
                {
                    UI.muteStyle[m].removeEventListener('change', muteStyleDDMO); // all valid, toggle play state
                }

                //🚧
                const media = Object.create(videoParams);
                media.updateTime = bounded(tick()) ? tick() : start;
                media.volume = t.getVolume();
                if (blockID != null)
                    lastBlockIDParameters.set(blockID, media);

                // clean...
                ClearTimers();
                recordedIDs.delete(blockID);
                allVideoParameters.delete(key);
                OnDestroyedObserver.disconnect();
                t.__proto__.enter = () => { };

                // either keep target
                const targetExist = document.querySelector('#' + key) == iframe;
                if (targetExist)
                    return console.log(`${key} is displaced, not removed, thus is not destroyed.`);

                //or destroy it after 1000ms
                setTimeout(() =>
                {
                    //this is too uggly
                    if (!targetExist)
                    {
                        t.destroy();
                        console.count('Destroyed! ' + key);
                    }
                }, 1000);
            }

        });
    });

    const config = { subtree: true, childList: true };

    OnDestroyedObserver.observe(document.body, config);
    //#endregion


    // #region pause onOffScreen
    const YscrollObserver = new IntersectionObserver(function (entries)
    {
        if (!entries[0])
            YscrollObserver.disconnect();

        if (tick() > updateStartTime + loadingMarginOfError && !t.__proto__.globalHumanInteraction) // and the interval function 'OneFrame' to prevent the loading black screen
        {
            if (UI.playStyle.visible_clips_start_to_play_unmuted.checked)
                togglePlay(entries[0]?.isIntersecting);
            else
                togglePlay(false);
        }
    }, { threshold: [0] });
    YscrollObserver.observe(iframe);
    //#endregion



    //🚧 🌿
    //#region unMute if referenced |OR| Pause and Avoid black screen loading bar
    const autoplayParent = iframe.closest('.rm-alias-tooltip__content') || //tooltip
        iframe.closest('.bp3-card') || //card
        iframe.closest('.myPortal'); //myPortal

    //simulate hover
    if (autoplayParent)
    {
        const simHover = new MouseEvent('mouseenter',
            {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });

        parent.dispatchEvent(simHover);

        t.__proto__.timeDisplayHumanInteraction = false;
    }
    else //Freeze
    {
        const OneFrame = setInterval(() =>
        {
            if (tick() > updateStartTime + loadingMarginOfError)
            {
                if (t.__proto__.globalHumanInteraction) // usees is listening, don't interrupt
                {
                    videoIsPlayingWithSound(true);
                }
                else if (inViewport(iframe) && !t.__proto__.globalHumanInteraction)
                {
                    togglePlay(UI.playStyle.visible_clips_start_to_play_unmuted.checked);
                }

                clearInterval(OneFrame);
            }
        }, 200);
    }
    //#endregion




    //#region Utils
    function tick(target = t)
    {
        return target?.getCurrentTime();
    }
    function bounded(x)
    {
        return start < x && x < end;
    }
    function validVolume()
    {
        return map?.volume || videoParams.volume || 40;
    }


    function videoIsPlayingWithSound(boo = true)
    {
        isSoundingFine(boo);
        togglePlay(boo);
    }


    function togglePlay(bol, el = iframe)
    {
        if (bol)
        {
            PlayIs(ytGifAttr.play.playing, el);
            t.playVideo();
        }
        else
        {
            PlayIs(ytGifAttr.play.paused);
            t.pauseVideo();
        }
    }

    function isSoundingFine(boo = true, el = iframe)
    {
        if (boo)
        {
            SoundIs(ytGifAttr.sound.unMute, el);
            t.unMute();
        }
        else
        {
            SoundIs(ytGifAttr.sound.mute, el);
            t.mute();
        }
    }

    function anyValidInAndOutKey(e)
    {
        if (e.buttons == 4) return true;

        for (const name in UI.InAndOutKeys)
            if (e[name] && isTrue(UI.InAndOutKeys[name]))
                return true;

        return false;
    }


    function AnyPlayOnHover()
    {
        return UI.playStyle.play_on_mouse_over.checked || UI.playStyle.strict_current_play_on_mouse_over.checked
    }


    function CanUnmute()//NotMuteAnyHover
    {
        return !UI.muteStyle.muted_on_mouse_over.checked && !UI.muteStyle.muted_on_any_mouse_interaction.checked
    }

    function SoundIs(style, el = iframe)
    {
        StyleAttribute(ytGifAttr.sound, style, el);
    }

    function PlayIs(style, el = iframe)
    {
        StyleAttribute(ytGifAttr.play, style, el);
    }

    function StyleAttribute(subStyle, style, el)
    {
        for (const key in subStyle)
            el.removeAttribute(subStyle[key]);
        el.setAttribute(style, '');
    }

    //#endregion

}

// UI InactiveStyles .... man...
//visibilityChange




//
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/
//loops between 'start' and 'end' boundaries
function onStateChange(state)
{
    const t = state.target;
    const map = allVideoParameters.get(t.h.id);

    if (state.data === YT.PlayerState.ENDED)
    {
        t.seekTo(map?.start || 0);

        if (UI.default.clip_end_sound != '')
        {
            if (UI.experience.sound_when_video_loops.checked)
            {
                play(UI.default.clip_end_sound);
                //#region util
                function play(url)
                {
                    return new Promise(function (resolve, reject)
                    { // return a promise
                        var audio = new Audio();                     // create audio wo/ src
                        audio.preload = "auto";                      // intend to play through
                        audio.autoplay = true;                       // autoplay when loaded
                        audio.onerror = reject;                      // on error, reject
                        audio.onended = resolve;                     // when done, resolve

                        audio.src = url
                    });
                }
                //#endregion
            }
        }

        if (UI.fullscreenStyle.smoll_vid_when_big_ends.checked && (currentFullscreenPlayer === t.h.id)) // let's not talk about that this took at least 30 mins. Don't. Ughhhh
        {
            if (document.fullscreenElement)
            {
                exitFullscreen();
                currentFullscreenPlayer = '';
            }
        }
    }


    if (state.data === YT.PlayerState.PLAYING)
    {
        if (t.__proto__.timerID === null) // NON ContinuouslyUpdateTimeDisplay
        {
            t.__proto__.enter();
        }
    }


    if (state.data === YT.PlayerState.PAUSED)
    {
        t.__proto__.ClearTimers();
    }
}




//#region Utilies
function inViewport(els)
{
    let matches = [],
        elCt = els.length;

    for (let i = 0; i < elCt; ++i)
    {
        let el = els[i],
            b = el.getBoundingClientRect(),
            c;

        if (b.width > 0 && b.height > 0 &&
            b.left + b.width > 0 && b.right - b.width < window.outerWidth &&
            b.top + b.height > 0 && b.bottom - b.width < window.outerHeight &&
            (c = window.getComputedStyle(el)) &&
            c.getPropertyValue('visibility') === 'visible' &&
            c.getPropertyValue('opacity') !== 'none')
        {
            matches.push(el);
        }
    }
    return matches;
}

function div(classList)
{
    let el = document.createElement('div');
    return emptyEl(classList, el);
}
function checkbox(classList)
{
    let el = document.createElement('input');
    return emptyEl(classList, el);
}
function radio(classList)
{
    let el = document.createElement('input');
    return emptyEl(classList, el);
}
function range(classList)
{
    let el = document.createElement('label');
    return emptyEl(classList, el);
}
function label(classList)
{
    let el = document.createElement('label');
    return emptyEl(classList, el);
}

function emptyEl(classList, el)
{
    if (classList)
        el.classList.add(classList);
    return el;
}

function exitFullscreen()
{
    if (document.exitFullscreen)
    {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen)
    {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen)
    {
        document.webkitExitFullscreen();
    }
}
function closestBlockID(el)
{
    return el?.closest('.rm-block__input')?.id
}
function allIframeIDprfx()
{
    return document.querySelectorAll(`[id*=${iframeIDprfx}]`);
}
function allIframeStyle(style)
{
    return document.querySelectorAll(`[${style}]`);
}

function htmlToElement(html)
{
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function cleanUpHTML(content)
{
    var dom = document.createElement('div');
    dom.innerHTML = content;
    var elems = dom.getElementsByTagName('*');
    for (var i = 0; i < elems.length; i++)
    {
        if (elems[i].innerHTML)
        {
            elems[i].innerHTML = elems[i].innerHTML.trim();
        }
    }
    return dom.innerHTML;
}
function isTrue(value)
{
    if (typeof (value) === 'string')
        value = value.trim().toLowerCase();

    switch (value)
    {
        case true:
        case 'true':
        case 1:
        case '1':
        case 'on':
        case 'yes':
            return true;
        default:
            return false;
    }
}


async function FetchText(url)
{
    const [response, err] = await isValidFetch(url); // firt time fetching something... This is cool
    if (response)
        return await response.text();
}
async function isValidFetch(url)
{
    try
    {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error('Request failed.');
        return [response, null];
    }
    catch (error)
    {
        console.log(`Your custom link ${url} is corrupt. ;c`);
        return [null, error];
    };
}

function isValidCSSUnit(value)
{
    //  valid CSS unit types
    const CssUnitTypes = ['em', 'ex', 'ch', 'rem', 'vw', 'vh', 'vmin',
        'vmax', '%', 'cm', 'mm', 'in', 'px', 'pt', 'pc'];

    // create a set of regexps that will validate the CSS unit value
    const regexps = CssUnitTypes.map((unit) =>
    {
        // creates a regexp that matches '#unit' or '#.#unit' for every unit type
        return new RegExp(`^[0-9]+${unit}$|^[0-9]+\\.[0-9]+${unit}$`, 'i');
    });

    // attempt to find a regexp that tests true for the CSS value
    const isValid = regexps.find((regexp) => regexp.test(value)) !== undefined;

    return isValid;
}

function ChangeElementType(element, newtype)
{
    let newelement = document.createElement(newtype);

    // move children
    while (element.firstChild) newelement.appendChild(element.firstChild);

    // copy attributes
    for (var i = 0, a = element.attributes, l = a.length; i < l; i++)
    {
        newelement.attributes[a[i].name] = a[i].value;
    }

    // event handlers on children will be kept. Unfortunately, there is
    // no easy way to transfer event handlers on the element itself,
    // this would require a full management system for events, which is
    // beyond the scope of this answer. If you figure it out, do it here.

    element.parentNode.replaceChild(newelement, element);
    return newelement;
}

function LoopTroughVisibleYTGIFsGlobal(config = { styleQuery: ytGifAttr, self: iframe, others_callback: () => { }, self_callback: () => { } })
{
    const ytGifs = inViewport(allIframeStyle(config?.styleQuery));
    for (const i of ytGifs)
    {
        const blockID = closestBlockID(i);
        if (i != self)
        {
            config?.others_callback(blockID, i);
        }
        else if (config.BlockID_self_callback)
        {
            config?.self_callback(blockID, i);
        }
    }
}

function targetIsSoundingFine(id, bol = true)
{
    return recordedIDs.get(id)?.target?.isSoundingFine(bol);
}
function targetNotTogglePlay(id, bol = false)
{
    return recordedIDs.get(id)?.target?.togglePlay(bol);
}
//#endregion





// I want to add ☐ ☑
// radios : mute pause when document is inactive ☑ ✘
// click the item checks the btn ☑ ☑

// play a sound to indicate the current gif makes loop ☑ ☑
// https://freesound.org/people/candy299p/sounds/250091/          * film ejected *
// https://freesound.org/data/previews/250/250091_4586102-lq.mp3

// https://freesound.org/people/nckn/sounds/256113/               * param ram *
// https://freesound.org/data/previews/256/256113_3263906-lq.mp3

// https://freesound.org/data/previews/35/35631_18799-lq.mp3 - roam research podoro ding -


// Discarted
// shortcuts for any btn ✘
// all hoverable actions, after 500ms the item it's checked // and this feature own btn ofcourse ✘
// add yt_api customizable settings ✘


// Bugs to fix
// hover a frame > mouse leave with sound > focus on another window > go back to roam & and mouse enter a new frame, both videos play unmuted even with strict_mute_everything_except_current enabled ☐
// work around > mouse enter a new frame holding middle mouse > mutes the previous, but the previous video still plays unmuted even though play_on_mouse_over enebled ☐
