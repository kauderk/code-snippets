// version 1 - semi-refactored
const targetPage = 'roam/js/kauderk/yt-gif/settings';
const RAP = window.kauderk.rap;

let TARGET_UID = RAP.getPageUid(targetPage);

let level0Cnt = -1;

const fmtSplit = ' : ';
const PmtSplit = ' / ';

const rad = 'radio',
    chk = 'checkbox',
    str = 'string',
    pmt = 'prompt',
    int = 'integer',
    bol = 'boolean',
    url = 'url',
    rng = 'range';

window.YT_GIF_SETTINGS_PAGE = {
    Workflow: {
        baseKey: addOrderPmt(`BIP BOP . . .`),
    },
    display: {
        baseKey: addOrder(chk),
        clip_life_span_format: dom('1'),
    },
    previousTimestamp: {
        baseKey: addOrder(rad),
        /* one a time */
        strict_start_timestamp: dom('1'),
        start_timestamp: dom(),
        fixed_start_timestamp: dom(),
    },
    previousVolume: {
        baseKey: addOrder(rad),
        /* one a time */
        strict_start_volume: dom('1'),
        start_volume: dom(),
        fixed_start_volume: dom(),
    },
    experience: {
        baseKey: addOrder(chk),
        sound_when_video_loops: dom('1'),
        awaiting_for_mouseenter_to_initialize: dom(),
        awaiting_with_video_thumnail_as_bg: dom('1'),
    },
    fullscreenStyle: {
        baseKey: addOrder(chk),
        smoll_vid_when_big_ends: dom('1'),
        mute_on_exit_fullscreenchange: dom(),
        pause_on_exit_fullscreenchange: dom(),
    },
    muteStyle: {
        baseKey: addOrder(chk),
        strict_mute_everything_except_current: dom('1'),
        muted_on_mouse_over: dom(),
        muted_on_any_mouse_interaction: dom(),
    },
    playStyle: {
        baseKey: addOrder(chk),
        strict_play_current_on_mouse_over: dom('1'),
        play_on_mouse_over: dom(),
        visible_clips_start_to_play_unmuted: dom(),
    },
    range: {
        baseKey: addOrder(rng),
        /*seconds up to 60*/
        timestamp_display_scroll_offset: dom('5', int),
        /* integers from 0 to 100 */
        end_loop_sound_volume: dom('50', int),
    },
    InAndOutKeys: {
        baseKey: addOrder(chk),
        /* middle mouse button is on by default */
        ctrlKey: dom('1'),
        shiftKey: dom(),
        altKey: dom(),
    },
    defaultValues: {
        baseKey: addOrder(),
        video_volume: subInputType(40, int),

        /* 'dark' or 'light' */
        css_theme: subInputType('light', str),

        /* empty means 50% - only valid css units like px  %  vw */
        player_span: subInputType('50%', str),

        /* distinguish between {{[[video]]:}} from {{[[yt-gif]]:}} or 'both' which is also valid*/
        override_roam_video_component: subInputType('', [bol, str]),

        /* src sound when yt gif makes a loop, empty if unwanted */
        end_loop_sound_src: subInputType('https://freesound.org/data/previews/256/256113_3263906-lq.mp3', url),
    },
}

// THE ORDER DOES MATTER, because of the counter
window.YT_GIF_SETTINGS_PAGE.Workflow.baseKey.string = `The first ${level0Cnt + 1} blocks will be added/removed automatically. The last parameters are customizable. 👋`;


init();

async function init()
{
    assignChildrenOrder(); // 🐌

    if (TARGET_UID == null) // Brand new installation
    {
        TARGET_UID = await RAP.navigateToUiOrCreate(targetPage);
        const addedBlocks = await addAllMissingBlocks(); // 🐌
    }
    else // Read and store Session Values
    {
        TARGE5T_UID = await RAP.navigateToUiOrCreate(targetPage);
        const entirePageText = await Read_Write_SettingsPage(TARGET_UID); // 🐌

        // THEY WILL STACK UP AGAINS EACHOTHER IF THEY ARE NOT EXAMINED - careful, bud
        const addedBlocks = await addAllMissingBlocks(); // 🐌
    }
    await RAP.SetNumberedViewWithUid(TARGET_UID);
    await RAP.CollapseDirectcChildren(TARGET_UID, false);
}

//#region HIDDEN FUNCTIONS
function assignChildrenOrder()
{
    for (const parentKey in window.YT_GIF_SETTINGS_PAGE)
    {
        let childrenOrderCounter = -1;
        for (const childKey in window.YT_GIF_SETTINGS_PAGE[parentKey])
        {
            for (const subKey in window.YT_GIF_SETTINGS_PAGE[parentKey][childKey])
            {
                if (subKey != 'order')
                {
                    continue;
                }

                const subOrder = window.YT_GIF_SETTINGS_PAGE[parentKey][childKey][subKey];
                if (!subOrder)
                {
                    window.YT_GIF_SETTINGS_PAGE[parentKey][childKey][subKey] = Number(++childrenOrderCounter);
                }
                break;
            }
        }
    }
}
async function Read_Write_SettingsPage(UID)
{
    const ChildrenHierarchy = await RAP.getBlockOrPageInfo(UID, true);

    if (!ChildrenHierarchy)
    {
        return 'Page is empty';
    }

    const accObj = { accStr: '' };
    return await Rec_Read_Write_SettingsPage(ChildrenHierarchy[0][0], accObj);
    async function Rec_Read_Write_SettingsPage(nextObj, accObj)
    {
        let { accStr } = accObj;
        const { nextUID, keyFromLevel0, selfOrder } = accObj;
        const { tab, nextStr, indent, parentUid } = await RelativeChildInfo(nextObj);
        const { uid, key, value } = getUidKeywordsFromString(nextStr);

        if (! await SuccesfullSttgUpt(indent)) // remove it
        {
            const uidToDelete = uid || nextUID;
            if (uidToDelete)
            {
                await removingBlock(uidToDelete); // 🐌
            }
        }
        else
        {
            accStr = accStr + '\n' + tab + nextStr; // outside of here, you'll the page after the delitions
        }


        if (nextObj.children)
        {
            const object = await RAP.getBlockOrPageInfo(nextObj.uid);
            const children = RAP.sortObjectsByOrder(object[0][0].children);

            for (const child of children)
            {
                const nextAccObj = {
                    accStr: accStr,
                    nextUID: uid,
                    keyFromLevel0: key,
                    selfOrder: child.order,
                };
                accStr = await Rec_Read_Write_SettingsPage(child, nextAccObj);
            }
        }

        return accStr;

        //#region local uitils
        async function SuccesfullSttgUpt(indent)
        {
            if (indent == 0)
            {
                if (RecIsValidNestedKey(window.YT_GIF_SETTINGS_PAGE, key)) // LEVEL 0 block upt
                {
                    let parentObj = window.YT_GIF_SETTINGS_PAGE[key];
                    const baseObj = baseUIpptValidation(parentObj.baseKey, nextStr, uid);

                    parentObj = assignInputTypesToChildren(parentObj);

                    await checkReorderBlock(parentUid, selfOrder, baseObj);

                    return true;
                }
            }
            else if (indent == 1)
            {
                if (RecIsValidNestedKey(window.YT_GIF_SETTINGS_PAGE, keyFromLevel0, [key])) // nested LEVEL 1 block upt
                {
                    const crrObjKey = baseUIpptValidation(window.YT_GIF_SETTINGS_PAGE[keyFromLevel0][key], nextStr, uid);

                    crrObjKey.sessionValue = value;
                    await checkReorderBlock(parentUid, selfOrder, crrObjKey);

                    return true;
                }
            }
            return false;
            //#region local func
            function assignInputTypesToChildren(parentObj) // 🐌 it's children will loop eventually inside this Rec Func ... man...
            {
                const parentInputType = parentObj.baseKey.inputType;

                if (parentInputType) 
                {
                    for (const parentKey in parentObj)
                    {
                        if (parentKey == 'baseKey')
                        {
                            continue;
                        }

                        for (const subKey in parentObj[parentKey])
                        {
                            if (subKey != 'inputType')
                            {
                                continue;
                            }
                            let childType = parentObj[parentKey].inputType; // will check it self... fuck!, but it's the same... so let's hope this doesn't brake anything
                            if (!childType)
                            {
                                parentObj[parentKey].inputType = parentInputType;
                            }
                        }
                    }
                }
                return parentObj;
            }
            async function checkReorderBlock(parentUid, selfOrder, childObjToMoveUID)
            {
                const validOrder = childObjToMoveUID.order;
                const validUid = childObjToMoveUID.uid;
                if (selfOrder != validOrder)
                {
                    await RAP.moveBlock(parentUid, validOrder, validUid);
                }
            }
            function RecIsValidNestedKey(obj, level, ...rest) // 🐌
            {
                if (obj === undefined) 
                {
                    return false
                }
                if (rest.length == 0 && obj.hasOwnProperty(level))
                {
                    return true
                }
                return RecIsValidNestedKey(obj[level], ...rest)
            }
            //#endregion
        }
        async function removingBlock(uid)
        {
            if (uid == TARGET_UID)
            {
                console.log(`"${nextStr}" pass on removal`);
                return;
                // the nature of the recursive func makes it
                // so the page can't be avoided, you don't want that - return
            }

            console.log(`"${nextStr}" <= invalid YT GIF setting was removed!`);
            await RAP.deleteBlock(uid);
        }
        async function RelativeChildInfo(obj)
        {
            const nextStr = obj.string || obj.title || '';
            const parentsHierarchy = await RAP.getBlockParentUids(obj.uid);
            let nestLevel = parentsHierarchy.length;
            let tab = '\t';
            return {
                tab: tab.repeat(nestLevel),
                nextStr,
                indent: nestLevel,
                parentUid: (parentsHierarchy[0])
                    ? parentsHierarchy[0][0]?.uid : TARGET_UID, // if undefined - most defenetly it's the direct child (level 0) of the page
            }
        }
        function getUidKeywordsFromString(nextStr, join = fmtSplit)
        {
            const rgxUid = new RegExp(/\(([^\)]+)\)/, 'gm'); //(XXXXXXXX)
            let splitedStr = nextStr.split(join); // deconstruct
            const firstKeyword = splitedStr.map(word => word.split(' ')[0]); // get only the first word inside the fmtSplit
            const rawUid = rgxUid.exec(firstKeyword[0]);

            return {
                uid: rawUid ? rawUid[1] : undefined,
                key: firstKeyword[1],
                value: firstKeyword[2],
            }
        }
        //#endregion
    }
}
async function addAllMissingBlocks()
{
    const accObj = {
        accStr: '',
        nextStr: this.accStr,

        accKeys: [],
        accHierarchyUids: [],
    };

    return await Rec_addAllMissingBlocks(window.YT_GIF_SETTINGS_PAGE, accObj);
    async function Rec_addAllMissingBlocks(nextObj, accObj = {})
    {
        let { accStr } = accObj;
        const { tab, nextStr } = accObj;

        accStr = accStr + '\n' + tab + nextStr;
        let HierarchyUids = [];


        for (const property in nextObj)
        {

            if (nextObj.hasOwnProperty(property) && typeof nextObj[property] === "object")
            {
                if (property == 'sessionValue')
                {
                    //console.log(`avoiding ${property}`);
                    continue;
                }
                let nestedPpt = nextObj[property];

                // 1. 
                if (property == 'baseKey')
                {
                    const preStr = nestedPpt.string;
                    const prntKey = accObj.parentKey;

                    const manualStt = {
                        m_uid: accObj.accHierarchyUids[accObj.accHierarchyUids.length - 1] || TARGET_UID,
                        m_strArr: (preStr)
                            ? [prntKey, preStr] : [prntKey], // extra join? no, then ignore it
                        m_order: nestedPpt.order,
                    };
                    nestedPpt = await TryToCreateUIblock(nestedPpt, manualStt);

                    HierarchyUids = [...HierarchyUids, nestedPpt?.uid];
                }

                // 2. the order does matter
                const nextAccObj = {
                    parentKey: property,

                    accKeys: [...accObj.accKeys, property],

                    accHierarchyUids: pushSame(accObj.accHierarchyUids, ...HierarchyUids), // this is weird

                    accStr: accStr,
                    tab: `\t`.repeat(0),
                    nextStr: nestedPpt.string || '',
                };


                accStr = await Rec_addAllMissingBlocks(nextObj[property], nextAccObj); // recursion with await - 🤯

                // 3. makes the most sense when the baseKey isn't missing
                if (nextObj[property].baseValue != undefined)
                {
                    const manualStt = {
                        m_uid: HierarchyUids[HierarchyUids.length - 1], // parent key to create under
                        m_strArr:
                            [
                                nextAccObj.accKeys[nextAccObj.accKeys.length - 1],
                                nestedPpt.sessionValue = nestedPpt.baseValue // it's a good that the value could be empty - you know it's paramater then
                            ], // "key description" : "value"
                        m_order: nestedPpt.order,
                    }

                    nestedPpt = await TryToCreateUIblock(nestedPpt, manualStt);
                }
            }
        }
        return accStr;

        async function TryToCreateUIblock(nestedBlock, manualStt)
        {
            if (!nestedBlock.examined)
            {
                nestedBlock = await UIBlockCreation(nestedBlock, manualStt);
            }
            return nestedBlock;
            //#region local util
            async function UIBlockCreation(baseKeyObj, manual = {})
            {
                const { m_order, m_uid, m_join, m_strArr } = manual;
                const { uid, string } = fmtSettings(m_strArr, m_join || fmtSplit);
                const { order: selfOrder } = baseKeyObj;

                await RAP.createBlock(
                    m_uid || TARGET_UID,
                    m_order || selfOrder || 10000,
                    string,
                    uid,
                );

                return baseUIpptValidation(baseKeyObj, string, uid);
                //#region local utils
                function fmtSettings(strArr = [], splitter = fmtSplit)
                {
                    const manualUID = RAP.createUid();
                    const preBlockStr = [`(${manualUID})`, ...strArr];
                    const blockStr = preBlockStr.join(splitter);
                    return {
                        uid: manualUID,
                        string: blockStr
                    }
                }
                //#endregion
            }
            //#endregion
        }

        function pushSame(arr = [], el)
        {
            arr.push(el);
            return arr;
        }
    }
}
function baseUIpptValidation(baseKeyObj, string, uid)
{
    baseKeyObj.string = string;
    baseKeyObj.uid = uid;
    baseKeyObj.examined = true;

    return baseKeyObj;
}
//#endregion



//#region sub OBJECTS
/*---------------------------------------------*/
function addOrderPmt(blockContent = '')
{
    return Object.assign(baseTmp(pmt, Number(++level0Cnt), blockContent));
}
/*---------------------------------------------*/
function addOrder(inputType)
{
    return Object.assign(baseTmp(inputType, Number(++level0Cnt)));
}
function dom(baseValue = '', inputType)
{
    const domObj = { domEl: '' }
    return Object.assign(subTemp(baseValue, inputType), domObj);
}
function subInputType(baseValue = '', inputType)
{
    return Object.assign(subTemp(baseValue, inputType));
}
/*---------------------------------------------*/
function subTemp(baseValue = '', inputType)
{
    const subSub = {
        baseValue: baseValue,
        sessionValue: null,
    }
    return Object.assign(baseTmp(inputType), subSub);
}
function baseTmp(_inputType, _order, _string = '')
{
    return {
        uid: '',
        string: _string,
        examined: false,
        inputType: _inputType,
        order: _order,
    }
}
/*---------------------------------------------*/
//#endregion



/* TODO LIST

add ☐ ☑
    alert to the user that some settings values could cause trouble

    code and page distinguishing between
        radio
        checkbox
        string
        url
        rng


added
    notice if property doesn't exist ☑ ☑
        then create it ☑ ☑


bugs ☐ ☑
    renaming, hard deleting sub properties... ☑
        they get deleted ☑
        and readded at the botttom ☑
        move around by user ☑

    moving around above the prompt mss, the injected block if any takes the that string instead


solved ☐ ☑
    when changes are made to the window.YT_GIF_SETTINGS_PAGE ☑ ☑
        the first block prompt message block count isn't updating

*/