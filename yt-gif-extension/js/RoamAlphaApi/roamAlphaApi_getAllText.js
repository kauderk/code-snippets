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


let level0Cnt = -1; //  used as incremented, base counter and recursive conditional

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


window.UISettings = {
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
        css_theme: subInputType('dark', str),

        /* empty means 50% - only valid css units like px  %  vw */
        player_spannnnnnn: subInputType('50%', str),

        /* distinguish between {{[[video]]:}} from {{[[yt-gif]]:}} or 'both' which is also valid*/
        override_roam_video_component: subInputType('', [bol, str]),

        /* src sound when yt gif makes a loop, empty if unwanted */
        end_loop_sound_src: subInputType('https://freesound.org/data/previews/256/256113_3263906-lq.mp3', url),
    },

    LogStatus: {
        baseKey: addOrderPmt(`Everything is alright :D`),
    },
}
// THE ORDER DOES MATTER, because of the counter
window.UISettings.Workflow.baseKey.string = `The first ${level0Cnt + 1} blocks will be added/removed automatically. The last parameters are customizable. 👋`;




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




assignChildrenOrder(); // 🐌

if (TargetUID == null)
{
    TargetUID = await navigateToUiOrCreate(targetPage);
    //const addedBlocks = await addMissingBlocks(); // 🐌
    const addedBlocks = await addAllMissingBlocks(); // 🐌
}
else // Read and store Session Values
{
    TargetUID = await navigateToUiOrCreate(targetPage);
    //const entirePageText = await Read_Write_SettingsPage(TargetUID); // 🐌
    // THEY WILL STACK UP AGAINS EACHOTHER IF THEY ARE NOT EXAMINED - careful, bud
    //const addedBlocks = await addMissingBlocks(); // 🐌🐌
    const addedBlocks = await addAllMissingBlocks(); // 🐌

    //console.log(entirePageText);
    //console.log(addedBlocks);
}
await SetNumberedViewWithUid(TargetUID);
await CollapseDirectcChildren(TargetUID, false);



//#region HIDDEN FUNCTIONS
async function Read_Write_SettingsPage(UID)
{
    const ChildrenHierarchy = await getBlockOrPageInfo(UID, true);

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
            const object = await getBlockOrPageInfo(nextObj.uid);
            const children = sortObjectsByOrder(object[0][0].children);

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
                if (RecIsValidNestedKey(window.UISettings, key)) // LEVEL 0 block upt
                {
                    let parentObj = window.UISettings[key];
                    const baseObj = baseUIpptValidation(parentObj.baseKey, nextStr, uid);

                    parentObj = assignInputTypesToChildren(parentObj);

                    await checkReorderBlock(parentUid, selfOrder, baseObj);

                    return true;
                }
            }
            else if (indent == 1)
            {
                if (RecIsValidNestedKey(window.UISettings, keyFromLevel0, [key])) // nested LEVEL 1 block upt
                {
                    const crrObjKey = baseUIpptValidation(window.UISettings[keyFromLevel0][key], nextStr, uid);

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
        }


        async function removingBlock(uid)
        {
            if (uid == TargetUID)
            {
                console.log(`"${nextStr}" pass on removal`);
                return;
                // the nature of the recursive func makes it
                // so the page can't be avoided, you don't want that - return
            }

            console.log(`"${nextStr}" <= invalid YT GIF setting was removed!`);
            await ccc.util.deleteBlock(uid);
        }

        //#endregion
    }
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
async function addMissingBlocks()
{
    let addedBlocks = [];

    for (const parentKey in window.UISettings)
    {
        const parentObj = window.UISettings[parentKey];
        let baseKeyObj = parentObj.baseKey;

        if (!baseKeyObj.examined)
        {
            const validStrings = (baseKeyObj.string)
                ? [parentKey, baseKeyObj.string] : [parentKey];

            const manualStt = {
                m_strArr: validStrings,
                m_order: baseKeyObj.order,
            };

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
                        m_strArr: [childKey, baseValue],
                        m_order: childObj.order,
                    };

                    childObj = await UIBlockCreation(childObj, manualStt);

                    addedBlocks.push(childObj.string);
                }
                break;
            }
        }
    }
    return addedBlocks;
}

async function addAllMissingBlocks()
{
    const accObj = {
        accStr: '',
        parentsHierarchyKeys: [],
        parentsHierarchyUids: [],
    };

    return await Rec_addMissingBlocks(window.UISettings, accObj);
}
async function Rec_addMissingBlocks(nextObj, accObj = {})
{
    let { accStr } = accObj;
    const { parentUid, tab, nextStr, parentsHierarchyKeys, parentsHierarchyUids } = accObj;

    accStr = accStr + '\n' + tab + nextStr;
    let localParentsHierarchyUids = [];

    for (const property in nextObj)
    {
        let indentTracker = 0;
        let localLoopParentsHierarchyUids = [];

        if (nextObj.hasOwnProperty(property) && typeof nextObj[property] === "object")
        {
            if (property == 'sessionValue')
            {
                console.log(`avoiding ${property}`);
                continue;
            }

            let baseKey = {};
            if (property == 'baseKey') // basically if it has valid nested blocks
            {
                baseKey = nextObj[property];
                const preStr = baseKey.string;
                const prntKey = accObj.parentKey;

                const manualStt = {
                    m_strArr: (preStr)
                        ? [prntKey, preStr] : [prntKey],
                    m_order: baseKey.order,
                };
                debugger;
                baseKey = await TryToCreateUIblock(baseKey, manualStt);
                localParentsHierarchyUids = [...localParentsHierarchyUids, baseKey?.uid];
                localLoopParentsHierarchyUids = [...localLoopParentsHierarchyUids, baseKey?.uid];
            }
            const validUidTopass = baseKey?.uid || '';
            const nextAccObj = {
                parentKey: property,
                parentsHierarchyKeys: [...accObj.parentsHierarchyKeys, property],
                tab: '\t'.repeat(Number(++indentTracker)),
                parentUid: validUidTopass,
                parentsHierarchyUids: [...accObj.parentsHierarchyUids, validUidTopass],
                nextStr: baseKey?.string,
            };
            console.log('next : ', property);
            accStr = await Rec_addMissingBlocks(nextObj[property], nextAccObj);

            if (nextObj[property].baseValue != undefined)
            {
                let nestedPpt = nextObj[property];
                debugger;
                const baseValue = nestedPpt.sessionValue = nestedPpt.baseValue;
                const validParentUid = accObj.parentsHierarchyUids[accObj.parentsHierarchyUids.length - 1];
                const validValidUid = nextAccObj.parentUid || nextAccObj.parentsHierarchyUids[nextAccObj.parentsHierarchyUids.length - 1];

                const loacalValidUid = localParentsHierarchyUids[localParentsHierarchyUids.length - 1];

                const uidFormLoopBaseKey = baseKey?.uid;
                const loacalloopValidUid = localLoopParentsHierarchyUids[localLoopParentsHierarchyUids.length - 1];
                const validParentKey = accObj.parentsHierarchyKeys[accObj.parentsHierarchyKeys.length - 1];

                const manualStt = {
                    m_uid: validParentUid || validValidUid || loacalValidUid || loacalloopValidUid || uidFormLoopBaseKey,
                    m_strArr: [validParentKey, baseValue],
                    m_order: nestedPpt.order,
                }
                console.log('nested : ', manualStt, accObj);
                //nestedPpt = await TryToCreateUIblock(nestedPpt, manualStt);
            }

        }
    }
    return accStr;

    async function TryToCreateUIblock(nestedBlock, manualStt)
    {
        if (!nestedBlock.examined)
        {
            nestedBlock = await UIBlockCreation(nestedBlock, manualStt);

            console.log('added: ', nestedBlock.string);
        }
        return nestedBlock;
    }
}
//#endregion



//#region SETTINGS PAGE UTILITIES
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

    return baseUIpptValidation(baseKeyObj, string, uid);
}
function baseUIpptValidation(baseKeyObj, string, uid)
{
    baseKeyObj.string = string;
    baseKeyObj.uid = uid;
    baseKeyObj.examined = true;

    return baseKeyObj;
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
async function checkReorderBlock(parentUid, selfOrder, childObjToMoveUID)
{
    const validOrder = childObjToMoveUID.order;
    const validUid = childObjToMoveUID.uid;
    if (selfOrder != validOrder)
    {
        await moveBlock(parentUid, validOrder, validUid);
    }
}
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
//#endregion



//#region  ROAM ALPHA API

async function moveBlock(parent_uid, block_order, block_to_move_uid)
{
    return window.roamAlphaAPI.moveBlock(
        {
            location: { "parent-uid": parent_uid, order: block_order },
            block: { uid: block_to_move_uid }
        });
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


//#endregion