/*

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
    when changes are made to the window.UISettings ☑ ☑
        the first block prompt message block count isn't updating 

*/

const targetPage = 'roam/js/kauderk/yt-gif/settings';
let TargetUID = await ccc.util.getPageUid(targetPage);


let level0Cnt = 0; //  used as incremented, base counter and recursive conditional

const fmtSplit = ' : ';
const PmtSplit = ' / ';

const rad = 'radio',
    chk = 'checkbox',
    str = 'string',
    int = 'integer',
    bol = 'boolean',
    url = 'url',
    rng = 'range';



window.UISettings = {
    /* permutations - checkbox */
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
    /* one at a time - radio */
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
        css_theme: subInputType('dark', str),

        /* empty means 50% - only valid css units like px  %  vw */
        player_spannnnnnn: subInputType('50%', str),

        /* distinguish between {{[[video]]:}} from {{[[yt-gif]]:}} or 'both' which is also valid*/
        override_roam_video_component: subInputType('', [bol, str]),

        /* src sound when yt gif makes a loop, empty if unwanted */
        end_loop_sound_src: subInputType('https://freesound.org/data/previews/256/256113_3263906-lq.mp3', url),
    },
}
// THE ORDER DOES MATTER, because of the counters
window.UISettingsPrompts = {
    workflow: addOrderPmt(0, `The first ${level0Cnt + 1} blocks will be added/removed automatically. The last parameters are customizable. 👋`),
    //
    //
    // ACTUAL UI SETTINGS
    //
    //
    LogStatus: addOrderEndPmt(`Everything is alright :D`),
}



//#region crazy obj code ... javascript are you ok?
function addOrderEndPmt(blockContent = '')
{
    return Object.assign(baseTmp(str, Number(++level0Cnt), blockContent));
}
function addOrderPmt(order = 0, blockContent = '')
{
    return Object.assign(baseTmp(str, order, blockContent));
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



assignChildrenOrder(); // 🐌

if (TargetUID == null)
{
    TargetUID = await navigateToUiOrCreate(targetPage);
    await BrandNewInstallation(TargetUID); // 🐌
}
else // Read and store Session Values
{
    TargetUID = await navigateToUiOrCreate(targetPage);
    //const prompts = await Read_Write_PromptMssgs(); // 🐌
    const entirePageText = await Read_Write_SettingsPage(TargetUID); // 🐌
    const addedBlocks = await addMissingSettings(); // 🐌🐌

    console.log(entirePageText);
    console.log(window.UISettings);
    console.log(addedBlocks);
}

await SetNumberedViewWithUid(TargetUID);
await CollapseDirectcChildren(TargetUID, false);
//return '';



async function Read_Write_PromptMssgs()
{
    const firstGen = await ccc.util.allChildrenInfo(block_uid);
    const children = sortObjectsByOrder(firstGen[0][0].children);

    for (const child of children)
    {
        for (const promptKey in window.UISettingsPrompts)
        {
            let promptObj = window.UISettingsPrompts[promptKey]; // before

            checkReorderBlock(TargetUID, promptObj.order, childObj);
        }
    }
}
async function Rec_Read_Write_PromptMssgs()
{

}


async function createUpdatePromptMssIfMissing(parentUID)
{
    const child0UID = await ccc.util.getNthChildUid(parentUID, 0);
    const child0Str = await ccc.util.blockString(child0UID);
    const prePromptMssg = PromptMssg();

    if (child0Str != prePromptMssg)
    {
        ccc.util.updateBlockString(child0UID, prePromptMssg);
    }
    function PromptMssg()
    {
        return `${fmtSplit}The first ${level0Cnt + 1} blocks will be added/removed automatically. The last parameters are customizable. 👋`;
    }
}

async function MonitorUpdatePromptBlocks()
{

}


function assignChildrenOrder()
{
    for (const parentKey in window.UISettings)
    {
        let childrenOrderCounter = -1;
        for (const childKey in window.UISettings[parentKey])
        {
            for (const subKey in window.UISettings[parentKey][childKey])
            {
                if (subKey != 'order')
                {
                    continue;
                }

                const subOrder = window.UISettings[parentKey][childKey][subKey];
                if (!subOrder)
                {
                    window.UISettings[parentKey][childKey][subKey] = Number(++childrenOrderCounter);
                }
                break;
            }
        }
    }
}




async function addMissingSettings()
{
    let addedBlocks = [];
    for (const parentKey in window.UISettings)
    {
        const parentObj = window.UISettings[parentKey];
        let baseKeyObj = parentObj.baseKey;

        if (!baseKeyObj.examined)
        {
            const manualStt = {
                m_order: baseKeyObj.order,
                m_strArr: [parentKey],
            };
            debugger;
            baseKeyObj = await UIBlockCreation(baseKeyObj, manualStt);

            addedBlocks.push(baseKeyObj.string);
        }

        for (const childKey in parentObj)
        {
            for (const subKey in parentObj[childKey]) // FIRST LEVEL > Sub properties
            {
                if (subKey != 'sessionValue')
                    continue;

                let childObj = parentObj[childKey];

                if (!childObj.examined)
                {
                    const baseValue = childObj.baseValue;
                    childObj.sessionValue = baseValue; // LEVEL 0 > sub

                    const manualStt = {
                        m_uid: baseKeyObj.uid,
                        m_order: childObj.order,
                        m_strArr: [childKey, baseValue],
                    };
                    debugger;
                    childObj = await UIBlockCreation(childObj, manualStt);

                    addedBlocks.push(addedSubInfo.string);
                }
                break;
            }
        }
    }
    return addedBlocks;
}
// I want to think of this expensive calculations as looping through a 2d grid array
// My monkey brain will never be able to compute THAT or even this
async function BrandNewInstallation()
{
    for (const promptKey in window.UISettingsPrompts)
    {
        let promptObj = window.UISettingsPrompts[promptKey]; // before

        const manualStt = {
            m_strArr: [promptObj.string],
            m_join: PmtSplit,
        };
        const addedRootPmpt = await UIBlockCreation(promptObj, manualStt);
    }

    for (const parentKey in window.UISettings)
    {
        let baseObjStt = window.UISettings[parentKey];

        const manualStt = { m_strArr: [parentKey] };
        const addedRoot = await UIBlockCreation(baseObjStt.baseKey, manualStt);

        for (const childKey in baseObjStt)
        {
            for (const subKey in baseObjStt[childKey]) // FIRST LEVEL > Sub properties
            {
                if (subKey != 'sessionValue')
                    continue;

                let SubPtt = baseObjStt[childKey];

                const baseValue = SubPtt.baseValue;
                SubPtt.sessionValue = baseValue;

                const manualStt = {
                    m_uid: addedRoot.uid,
                    m_strArr: [childKey, baseValue],
                };
                SubPtt = await UIBlockCreation(SubPtt, manualStt);

                break;
            }
        }
    }

}
async function UIBlockCreation(baseKeyObj, manual = {})
{
    const { m_order, m_uid, m_join, m_strArr } = manual;
    const { uid, string } = fmtSettings(m_strArr, m_join || fmtSplit);
    const { order: selfOrder } = baseKeyObj;

    await createBlock(
        m_uid || TargetUID,
        m_order || selfOrder || 10000,
        string,
        uid,
    );
    baseKeyObj.uid = uid;
    baseKeyObj.string = string;
    baseKeyObj.examined = true;

    return baseKeyObj;
}







async function Read_Write_SettingsPage(UID)
{
    const ChildrenHierarchy = await getBlockOrPageInfo(UID, true);

    if (!ChildrenHierarchy)
    {
        return 'Page is empty';
    }

    const accObj = { accStr: '' };
    return await Rec_Read_Write_SettingsPage(ChildrenHierarchy[0][0], accObj);
}

async function Rec_Read_Write_SettingsPage(nextObj, accObj)
{
    let { accStr } = accObj;
    const { nextUID, keyFromLevel0, selfOrder } = accObj;
    const { tab, nextStr, indent, parentUid } = await RelativeChildInfo(nextObj);
    const { uid, key, value } = getSettingsFromString(nextStr);

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
        const object = await getBlockOrPageInfo(nextObj.uid);
        const children = sortObjectsByOrder(object[0][0].children);

        for (const child of children)
        {
            // if (child.order > UISettingsCounter) // stop here // 🐌
            // {
            //     return accStr;
            // }

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
    function getSettingsFromString(nextStr)
    {
        //const rgxBase = new RegExp(/\(([^\)]+)\)( : )(\b\w+\b)| |:|(\b.*\b)/, 'gm');
        // const rgxKey = new RegExp(/(?<=\)\s:\s)(\b\w+\b)/, 'gm'); //) : XXXXXXXXX
        // (?<=\S : )([^\s]*)

        // big monkey brain .. uga buga
        // split the string by " : " and compare keys and values [1], [2]
        // uga buga

        const { rawUid, firstWords } = splitFormattedString();

        return {
            uid: rawUid ? rawUid[1] : undefined,
            key: firstWords[1],
            value: firstWords[2],
        }

        function splitFormattedString()
        {
            const rgxUid = new RegExp(/\(([^\)]+)\)/, 'gm'); //(XXXXXXXX)
            let splitedStr = nextStr.split(fmtSplit); // deconstruct
            const firstWords = splitedStr.map(word => word.split(' ')[0]); // get only the first word inside the fmtSplit
            const rawUid = rgxUid.exec(firstWords[0]);
            return { rawUid, firstWords };
        }
    }

    async function SuccesfullSttgUpt(indent)
    {
        if (indent == 0)
        {
            if (RecIsValidNestedKey(window.UISettings, key)) // LEVEL 0 block upt
            {
                let parentObj = window.UISettings[key];
                const baseObj = baseBlockWrite(parentObj.baseKey);

                parentObj = assignInputTypesToChildren(parentObj);

                await checkReorderBlock(parentUid, selfOrder, baseObj);

                return true;
            }
        }
        else if (indent == 1)
        {
            if (RecIsValidNestedKey(window.UISettings, keyFromLevel0, [key])) // nested LEVEL 1 block upt
            {
                const crrObjKey = baseBlockWrite(window.UISettings[keyFromLevel0][key]);

                crrObjKey.sessionValue = value;
                await checkReorderBlock(parentUid, selfOrder, crrObjKey);

                return true;
            }
        }
        return false;

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

        function baseBlockWrite(genericObj)
        {
            genericObj.string = nextStr;
            genericObj.uid = uid;
            genericObj.examined = true;
            return genericObj; // pass by value bruh
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
    async function removingBlock(uid)
    {
        if (uid == TargetUID || nextStr.includes(PmtSplit))
        {
            console.log(`"${nextStr}" pass on removal`);
            return;
        }
        // the nature of the recursive func makes it
        // so the page can't be avoided, you don't want that - return

        console.log(`"${nextStr}" <= invalid YT GIF setting was removed!`);
        await ccc.util.deleteBlock(uid);
    }
    async function RelativeChildInfo(obj)
    {
        const nextStr = obj.string || obj.title || '';
        const parentsHierarchy = await getBlockParentUids(obj.uid);
        let nestLevel = parentsHierarchy.length;
        let tab = '\t';
        return {
            tab: tab.repeat(nestLevel),
            nextStr,
            indent: nestLevel,
            parentUid: (parentsHierarchy[0])
                ? parentsHierarchy[0][0]?.uid : TargetUID, // if undefined - most defenetly it's the direct child (level 0) of the page
        }
    }
    //#endregion
}





async function checkReorderBlock(parentUid, selfOrder, childObjToMoveUID)
{
    const validOrder = childObjToMoveUID.order;
    const validUid = childObjToMoveUID.uid;
    if (selfOrder != validOrder)
    {
        await moveBlock(parentUid, validOrder, validUid);
    }
}
async function moveBlock(parent_uid, block_order, block_to_move_uid)
{
    return window.roamAlphaAPI.moveBlock(
        {
            location: { "parent-uid": parent_uid, order: block_order },
            block: { uid: block_to_move_uid }
        });
}


/**
 * 
 * @param {Array} strArr 
 * @returns 
 */
function fmtSettings(strArr = [], splitter = fmtSplit)
{
    const manualUID = roamAlphaAPI.util.generateUID();
    const preBlockStr = [`(${manualUID})`, ...strArr];
    const blockStr = preBlockStr.join(splitter);
    return {
        uid: manualUID,
        string: blockStr
    }
}
async function batchCreateBlocks(parent_uid, starting_block_order, string_array_to_insert)
{
    parent_uid = parent_uid.replace('((', '').replace('))', '');
    let addedInfo = [];
    await string_array_to_insert.forEach(async (item, counter) =>
    {
        addedInfo.push(await createBlock(parent_uid, counter + starting_block_order, item.toString()))
    });
    return addedInfo;
}

async function createBlock(parent_uid, block_order, block_string, manualUID = false)
{
    parent_uid = parent_uid.replace('((', '').replace('))', '');
    let newUid = (!manualUID) ? roamAlphaAPI.util.generateUID() : manualUID; // polymorphism man...

    await window.roamAlphaAPI.createBlock(
        {
            location: {
                "parent-uid": parent_uid,
                order: block_order
            },
            block: {
                string: block_string.toString(),
                uid: newUid
            }
        });
    await roam42.common.sleep(10); //seems a brief pause is need for DB to register the write
    return {
        uid: newUid,
        parentUid: parent_uid,
        order: block_order,
        string: block_string,
    };
}






async function SetNumberedViewWithUid(uid)
{
    //https://github.com/dvargas92495/roam-js-extensions/blob/c7092e40f6602a97fb555ae9d0cda8d2780ba0f2/src/entries/mouseless.ts#:~:text=%60%5B%3Afind%20(pull%20%3Fb%20%5B%3Achildren/view-type%5D)%20%3Awhere%20%5B%3Fb%20%3Ablock/uid%20%22%24%7Buid%7D%22%5D%5D%60
    const newViewType = "numbered";
    window.roamAlphaAPI.updateBlock({
        block: { uid, "children-view-type": newViewType },
    });
}
async function CollapseDirectcChildren(block_uid, block_expanded)
{
    const firstGen = await ccc.util.allChildrenInfo(block_uid);
    const children = sortObjectsByOrder(firstGen[0][0].children);

    for (const child of children)
    {
        await ExpandBlock(child.uid, block_expanded);
    }
}
async function ExpandBlock(block_uid, block_expanded)
{
    return await window.roamAlphaAPI.updateBlock(
        { block: { uid: block_uid, open: block_expanded } });
}






async function getBlockOrPageInfo(blockUid)
{
    const results = await window.roamAlphaAPI.q(`[:find (pull ?e [ :node/title :block/string :block/children :block/uid :block/order { :block/children ... } ] ) :where [ ?e :block/uid \"${blockUid}\" ] ]`);
    /*const Reading =
        `[:find 
            (pull 
                ?e 
                    [ 
                        :node/title 
                        :block/string 
                        :block/children 
                        :block/uid 
                        :block/order 
                        { 
                            :block/children ... 
                        } 
                    ] 
            ) 
            :where 
                [ 
                    ?e 
                    :block/uid \"${blockUid}\" 
                ] 
         ]`
        ;*/
    return (results.length == 0) ? undefined : results
}

function sortObjectsByOrder(o)
{
    return o.sort((a, b) => a.order - b.order);
}

async function getBlockParentUids(uid)
{
    try
    {
        var parentUIDs = await window.roamAlphaAPI.q(`[:find (pull ?block [{:block/parents [:block/uid]}]) :in $ [?block-uid ...] :where [?block :block/uid ?block-uid]]`, [uid])[0][0];
        /*var Reading = await window.roamAlphaAPI.q(
            `[:find 
                (pull 
                    ?block 
                        [
                            {
                                :block/parents
                                [
                                    :block/uid
                                ]
                            }
                        ]
                ) 
                :in $ 
                    [
                        ?block-uid ...
                    ] 
                :where 
                    [
                        ?block 
                        :block/uid ?block-uid
                    ]
             ]`
            , [uid])[0][0];*/
        var UIDS = parentUIDs.parents.map(e => e.uid)
        UIDS.shift();
        return getPageNamesFromBlockUidList(UIDS)
    }
    catch (e) 
    {
        return '';
    }
}
async function getPageNamesFromBlockUidList(blockUidList)
{
    //blockUidList ex ['sdfsd', 'ewfawef']
    var rule = '[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]';
    var query = `[:find  (pull ?block [:block/uid :block/string])(pull ?page [:node/title :block/uid])
                                     :in $ [?block_uid_list ...] %
                                     :where
                                      [?block :block/uid ?block_uid_list]
                                     [?page :node/title]
                                     (ancestor ?block ?page)]`;
    var results = await window.roamAlphaAPI.q(query, blockUidList, rule);
    return results;
}


async function navigateToUiOrCreate(destinationPage, openInSideBar = false, sSidebarType = 'outline')
{
    //sSidebarType = block, outline, graph
    const prefix = destinationPage.substring(0, 2);
    const suffix = destinationPage.substring(destinationPage.length - 2, destinationPage.length);
    if (sSidebarType == 'outline' && (prefix == '((' && suffix == '))')) 
    {
        //test if block ref to open in block mode
        sSidebarType = 'block'; //chnage to block mode
    }
    if ((prefix == '[[' && suffix == ']]') || (prefix == '((' && suffix == '))'))
    {
        // [[ ]] or (( ))
        destinationPage = destinationPage.substring(2, destinationPage.length - 2);
    }

    let uid = await ccc.util.getPageUid(destinationPage);

    if (uid == null)
    {
        //test if UID for zooming in, if not create page
        uid = await getPageInfo(destinationPage);
        if (uid == null)
        {
            //not a page, nor UID so create page
            if (destinationPage.length > 255)
            {
                destinationPage = destinationPage.substring(0, 254);
            }
            await ccc.util.getOrCreatePageUid(destinationPage)

            await sleep(50);

            uid = await await ccc.util.getPageUid(destinationPage);
        }
        else
        {
            uid = destinationPage; //seems to be a UID, zoom it
        }
    }


    if (openInSideBar == false)
    {
        document.location.href = baseUrl().href + '/' + uid;
    }
    else
    {
        await roamAlphaAPI.ui.rightSidebar.addWindow(
            {
                window:
                {
                    "block-uid": uid,
                    type: sSidebarType
                }
            }
        );
    }
    return uid;

    function sleep(afterMiliseconds)
    {
        return new Promise(resolve => setTimeout(resolve, afterMiliseconds))
    }

    function baseUrl()
    {
        const url = new URL(window.location.href);
        const parts = url.hash.split('/');
        url.hash = parts.slice(0, 3).concat(['page']).join('/');
        return url;
    };

    async function getPageInfo(blockUid)
    {
        const results = await window.roamAlphaAPI.q(`[:find (pull ?e [ :node/title :block/string :block/children :block/uid :block/order { :block/children ... } ] ) :where [ ?e :block/uid \"${blockUid}\" ] ]`);
        return (results.length == 0) ? undefined : results
    }
} //navigateUIToDate

