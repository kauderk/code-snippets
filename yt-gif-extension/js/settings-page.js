// version 1 - semi-refactored
const targetPage = 'roam/js/kauderk/yt-gif/settings';
const UTILS = window.kauderk.util;
const RAP = window.kauderk.rap;

let TARGET_UID = RAP.getPageUid(targetPage);

const fmtSplit = ' : ';
const PmtSplit = ' / ';
const cptrPrfx = '<',
    cptrSufx = '>';

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
        joins: {
            baseKey: addOrderPmt(`either "ﾠ:ﾠ" for actual settings or "ﾠ/ﾠ" for prompt guidelines`), // he doesn't know... he knows "ﾠ" != " "
        },
        parameters: {
            baseKey: addOrderPmt(`(xxxuidxxx) : yt_gif_settings_key : <value>`),
            uid: {
                baseKey: addOrderPmt(`(xxxuidxxx) unique per user data base, without it the settings can't be written on this page`),
            },
            key: {
                baseKey: addOrderPmt(`yt_gif_settings_key second way to know which setting to change`),
            },
            value: {
                baseKey: addOrderPmt(`<value> in many cases optional and most of the time a binary switch, on - off`),
            },
        },
        reach: {
            baseKey: addOrderPmt(`Blocks below "LogStatus" will be ignored`),
        },
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
        yikes: dom(),
        yikesyikes: dom(),
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
        css_theme: subInputType('dark', str),

        /* empty means 50% - only valid css units like px  %  vw */
        player_span: subInputType('50%', str),

        /* distinguish between {{[[video]]:}} from {{[[yt-gif]]:}} or 'both' which is also valid*/
        override_roam_video_component: subInputType('', [bol, str]),

        /* src sound when yt gif makes a loop, empty if unwanted */
        end_loop_sound_src: subInputType('https://freesound.org/data/previews/256/256113_3263906-lq.mp3', url),
    },
    LogStatus: {
        baseKey: addOrderPmt(`Everything looks alright :D`),
    },
}

// THE ORDER DOES MATTER, because of the counter
window.YT_GIF_SETTINGS_PAGE.Workflow.baseKey.string = `The first ${Object.keys(window.YT_GIF_SETTINGS_PAGE).length} blocks will be -added on updates- and -removed if drepreacted- automatically. The last parameters "<>" are customizable. 🐕 👋`;


(async function init()
{
    const { acc, keyObjMap } = await assignChildrenMissingValues();

    if (TARGET_UID == null) // Brand new installation
    {
        TARGET_UID = await RAP.navigateToUiOrCreate(targetPage);
        const addedBlocks = await addAllMissingBlocks(); // 🐌
    }
    else // Read and store Session Values
    {
        const entirePageText = await Read_Write_SettingsPage(TARGET_UID, keyObjMap); // 🐌
        const addedBlocks = await addAllMissingBlocks(); // 🐌 // THEY WILL STACK UP AGAINS EACHOTHER IF THEY ARE NOT EXAMINED - careful, bud
    }
    await RAP.SetNumberedViewWithUid(TARGET_UID);
    await RAP.CollapseDirectcChildren(TARGET_UID, false);
})();

//#region HIDDEN FUNCTIONS
async function assignChildrenMissingValues()
{
    let = keyObjMap = new Map(); // acc inside the Rec_func
    const passAccObj = {
        accStr: '',
        nextStr: '',
        indent: -1,
        accKeys: [],
    };

    return {
        acc: await Rec_assignChildrenMissingValues(window.YT_GIF_SETTINGS_PAGE, passAccObj),
        keyObjMap
    };
    async function Rec_assignChildrenMissingValues(nextObj, accObj = passAccObj)
    {
        let { accStr } = accObj;
        let funcGeneralOrder = -1;

        const { nextStr, indent, accKeys } = accObj;
        const tab = `\t`.repeat((indent < 0) ? 0 : indent);

        //accStr = accStr + '\n' + tab + accKeys.join(" ");
        accStr = accStr + '\n' + tab + nextStr;

        for (const property in nextObj)
        {
            const nestedPpt = nextObj[property];
            if (nextObj.hasOwnProperty(property) && nestedPpt && typeof nestedPpt === "object" && !(nestedPpt instanceof Array))
            {
                const nextAccObj = {
                    indent: indent + 1,
                    inputTypeFromBaseKey: nestedPpt?.baseKey?.inputType,

                    accStr: accStr,
                    nextStr: nestedPpt.string || '',
                };

                /* store for later */
                if (property != 'baseKey') // there are too many, filter a litle bit
                {
                    const directObjPpts = (nestedPpt?.baseKey) ? nestedPpt.baseKey : nestedPpt;
                    keyObjMap.set(property, directObjPpts);
                }

                /* the order to acc does matter */
                accStr = await Rec_assignChildrenMissingValues(nextObj[property], nextAccObj);


                /*  this took two straight days ... thank you thank you */
                if (nestedPpt.baseValue != undefined) // inline object ≡ no baseKey
                {
                    // 1.
                    nestedPpt.order = Number(++funcGeneralOrder);
                    nestedPpt.indent = nextAccObj.indent;
                    // 2.
                    nestedPpt.inputType = (accObj.inputTypeFromBaseKey) ? accObj.inputTypeFromBaseKey : nestedPpt.inputType; // valid form baseKey? no, then keep same
                }
                else if (nestedPpt.baseKey != undefined) // the ptt is a wrapper, look on it's level to access the baseKey
                {
                    // 1.
                    nestedPpt.baseKey.order = Number(++funcGeneralOrder);
                    nestedPpt.baseKey.indent = nextAccObj.indent;
                }
            }
        }
        return accStr;
    }
}
async function Read_Write_SettingsPage(UID, keyObjMap = new Map())
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
        const { uid, key, value, caputuredValue, caputureValueOk, splitedStrArr, join } = getKeywordsFromBlockString(nextStr);

        if (! await SuccessfulSttgUpt(indent)) // remove it
        {
            const uidToDelete = uid || nextUID;
            if (uidToDelete)
            {
                debugger;
                await tryToremoveBlock(uidToDelete); // 🐌
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
                if (!nextStr.includes('LogStatus'))
                {
                    accStr = await Rec_Read_Write_SettingsPage(child, nextAccObj);
                }
            }
        }

        return accStr;

        //#region local uitils
        async function SuccessfulSttgUpt()
        {
            const targeObj = keyObjMap.get(key);
            if (targeObj)
            {

                if (join == PmtSplit)
                {
                    const { stringOK, v_string, v_uid } = await validateBlockContent(targeObj, nextStr, splitedStrArr, uid, accObj.nextUID);
                    if (!stringOK)
                    {
                        console.log(`Updating block  ((${uid})) -> \n${nextStr} \nﾠ\nto ((${v_uid})) ->  \nﾠ\n${v_string}`)
                        await RAP.updateBlock(v_uid, v_string);
                    }
                }

                const crrObjKey = assertObjPpt_base(targeObj, nextStr, uid);

                if (join == fmtSplit)
                {
                    crrObjKey.sessionValue = value;
                    crrObjKey.caputuredValue = caputuredValue;

                    if (!caputureValueOk && splitedStrArr[2]) // caputured string too
                    {
                        console.warn(`BUD bud - "${nextStr}" value is looking weird, it will default to false...`);
                    }
                }


                await checkReorderBlock(parentUid, selfOrder, crrObjKey);
                return true;
            }
            return false;

            async function checkReorderBlock(parentUid, selfOrder, childObjToMoveUID)
            {
                const validOrder = childObjToMoveUID.order;
                const validUid = childObjToMoveUID.uid;
                try
                {
                    if (selfOrder != validOrder)
                    {
                        await RAP.moveBlock(parentUid, validOrder, validUid);
                    }
                } catch (err)
                {
                    debugger;
                }
            }
        }
        async function validateBlockContent(obj, nextStr, splitedStrArr, caputuredUID, nextUID)
        {
            const caputuredString = splitedStrArr[2] || ''; // undefinded means it doens't requieres a third param, that's ok

            const uidOk = await RAP.getBlockOrPageInfo(caputuredUID);
            const v_uid = (uidOk) ? caputuredUID : nextUID;

            let v_string = nextStr;
            let stringOK = true;

            if (obj.string != caputuredString)
            {
                splitedStrArr.splice(2, 1, obj.string);
                v_string = splitedStrArr.join(obj.join);
                stringOK = false;
            }

            return {
                v_string,
                v_uid,
                stringOK
            }
        }
        async function tryToremoveBlock(uid)
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
        function getKeywordsFromBlockString(nextStr)
        {
            const rgxUid = new RegExp(/\(([^\)]+)\)/, 'gm'); //(XXXXXXXX)
            const join = includesAtlest(nextStr, [PmtSplit, fmtSplit]);
            const splitedStrArr = nextStr.split(join); // deconstruct
            const everyFirstKeyword = splitedStrArr.map(word => word.split(' ')[0]); // returns array of words

            const preUid = rgxUid.exec(everyFirstKeyword[0]);
            const p_uid = preUid ? preUid[1] : undefined;

            const { value, caputureValueOk } = tryTrimCapturedValue(everyFirstKeyword[2] || '');

            return {
                uid: p_uid,

                key: everyFirstKeyword[1],

                caputuredValue: everyFirstKeyword[2],
                value: value,
                caputureValueOk,

                splitedStrArr,

                join
            }
            function tryTrimCapturedValue(string)
            {
                const prefix = string.substring(0, 1);
                const suffix = string.substring((string.length - 1), string.length);
                if (prefix == cptrPrfx && suffix == cptrSufx)
                {
                    // < >
                    return {
                        value: string.substring(1, string.length - 1),
                        caputureValueOk: true,
                    }
                }
                return {
                    value: string,
                    caputureValueOk: false,
                }
            }
            function includesAtlest(string, srtArr)
            {
                for (const s of srtArr)
                {
                    if (string.includes(s))
                    {
                        return s;
                    }
                }
                return fmtSplit;
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
            if (nextObj.hasOwnProperty(property) && typeof nextObj[property] === "object" && nextObj[property] != null)
            {
                if (property == 'sessionValue')
                {
                    //console.log(`avoiding ${property}`);
                    continue;
                }

                let nestedPpt = nextObj[property];

                // 1. indent = 0
                if (property == 'baseKey')
                {
                    if (nestedPpt.examined == false)
                    {
                        const preStr = nestedPpt.string;
                        const prntKey = accObj.parentKey;

                        const manualStt = {
                            m_uid: accObj.accHierarchyUids[accObj.accHierarchyUids.length - 1] || TARGET_UID,
                            m_strArr: (preStr)
                                ? [prntKey, preStr] : [prntKey], // extra join? no, then ignore it
                            m_order: nestedPpt.order,
                        };
                        nestedPpt = await UIBlockCreation(nestedPpt, manualStt);
                    }

                    HierarchyUids = [...HierarchyUids, nestedPpt?.uid];
                }

                // 2. the order does matter
                const nextAccObj = {
                    parentKey: property,

                    accKeys: [...accObj.accKeys, property],

                    accHierarchyUids: UTILS.pushSame(accObj.accHierarchyUids, ...HierarchyUids), // this is weird

                    accStr: accStr,
                    tab: `\t`.repeat(0),
                    nextStr: nestedPpt.string || '',
                };


                accStr = await Rec_addAllMissingBlocks(nextObj[property], nextAccObj); // recursion with await - 🤯

                // 3. indent = 1
                if (nestedPpt.examined == false)
                {
                    const value = nestedPpt.sessionValue = nestedPpt.baseValue;
                    const caputuredValue = nestedPpt.caputuredValue = `${cptrPrfx}${value}${cptrSufx}`; // BIG BOI  <value>

                    const manualStt = {
                        m_uid: HierarchyUids[HierarchyUids.length - 1], // parent key to create under
                        m_strArr:
                            [
                                nextAccObj.accKeys[nextAccObj.accKeys.length - 1],
                                caputuredValue
                            ], // "key_description" : "<value>"
                        m_order: nestedPpt.order,
                    }

                    nestedPpt = await UIBlockCreation(nestedPpt, manualStt);
                }
            }
        }
        return accStr;

        // async function TryToCreateUIblock(nestedBlock, manualStt)
        // {
        //     if (!nestedBlock.examined)
        //     {
        //         nestedBlock = await UIBlockCreation(nestedBlock, manualStt);
        //     }
        //     return nestedBlock;
        //     //#region local util
        //     //#endregion
        // }
        async function UIBlockCreation(baseKeyObj, manual = {})
        {
            const { m_order, m_uid, m_join, m_strArr } = manual;
            const { uid, string } = fmtSettings(m_strArr, m_join || baseKeyObj.join);
            const { order: selfOrder } = baseKeyObj;

            await RAP.createBlock(
                m_uid || TARGET_UID,
                m_order || selfOrder || 10000,
                string,
                uid,
            );

            return assertObjPpt_base(baseKeyObj, string, uid);
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
    }
}
function assertObjPpt_base(baseKeyObj, string, uid)
{
    const obj = {
        examined: true,
        uid: uid,
        string: string
    }
    return Object.assign(baseKeyObj, obj);
}
//#endregion



//#region sub OBJECTS
/*---------------------------------------------*/
function addOrderPmt(blockContent = '')
{
    const promptObj = {
        join: PmtSplit,
        inputType: pmt,
        string: blockContent
    }
    return Object.assign(baseTmp(), promptObj);
}
/*---------------------------------------------*/
function addOrder(inputType)
{
    return baseTmp(inputType);
}
function dom(baseValue = '', inputType)
{
    const domObj = {
        domEl: '',
        baseValue: baseValue,
        inputType: inputType,
    }
    return Object.assign(subTemp(), domObj);
}
function subInputType(baseValue = '', inputType)
{
    const subInputObj = {
        baseValue: baseValue,
        inputType: inputType,
    }
    return Object.assign(subTemp(), subInputObj);
}
/*---------------------------------------------*/
function subTemp(baseValue = '', inputType)
{
    const subSub = {
        baseValue: baseValue,
        sessionValue: null,
        caputuredValue: '<>',
        join: fmtSplit,
    }
    return Object.assign(baseTmp(inputType), subSub);
}
function baseTmp(_inputType, _string = '')
{
    return {
        examined: false,

        uid: '',
        string: _string,

        inputType: _inputType,

        indent: null,
        child: null,
        order: null,
    }
}
/*---------------------------------------------*/
//#endregion



/* TODO LIST

add ☐ ☑
    read values from settings page ☐
        alert to the user that some settings values could cause trouble ☐

        damage control ☐
            if the written uid doesn't match with the acutal block uid,
                update it ☐
                    if the property_key does match with the settings-page-obj

    create a recursive fucc to add order to nested objs ☐

    code and page distinguishing between ☑ ☑
        radio
        checkbox
        string
        url
        rng

added
    notice if property doesn't exist ☑ ☑
        then create it ☑ ☑


bugs ☐ ☑


FIXME
    tryToremoveBlock
        nested blocks, specially those inside addOrderPmt()
        get removed just to be readded by next func

    order & indent on non baseKeys plz


solved ☐ ☑
    the inputType ins't being updated on dom() objs ☑ ☑

    when changes are made to the window.YT_GIF_SETTINGS_PAGE ☑ ☑
        the first block prompt message block count isn't updating

    renaming, hard deleting sub properties... ☑ ☑
        they get deleted ☑
        and readded at the botttom ☑
        move around by user ☑

    moving around above the prompt mss, ☑ ☑
        the injected block if any ---- that block inherits that string
*/