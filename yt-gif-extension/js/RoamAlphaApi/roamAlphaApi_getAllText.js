
const targetPage = 'Test/02';
const TargetUID = await ccc.util.getPageUid(targetPage);

if (TargetUID == null) // BrandNewInstallation
{
    window.UISettings = {
        /* permutations - checkbox */
        display: {
            baseValues: basePpt('1'),
            clip_life_span_format: domElPpt('1'),
        },
        previous: {
            baseValues: basePpt('2'),
            /* one a time */
            strict_start_timestamp: domElPpt('1'),
            start_timestamp: domElPpt(''),
            fixed_start_timestamp: domElPpt(''),
            /* one a time */
            strict_start_volume: domElPpt('1'),
            start_volume: domElPpt(''),
            fixed_start_volume: domElPpt(''),
        },
        experience: {
            baseValues: basePpt('3'),
            sound_when_video_loops: domElPpt('1'),
            awaiting_for_mouseenter_to_initialize: domElPpt(''),
            awaiting_with_video_thumnail_as_bg: domElPpt('1'),
        },
        fullscreenStyle: {
            baseValues: basePpt('4'),
            smoll_vid_when_big_ends: domElPpt('1'),
            mute_on_exit_fullscreenchange: domElPpt(''),
            pause_on_exit_fullscreenchange: domElPpt(''),
        },
        /* one at a time - radio */
        muteStyle: {
            baseValues: basePpt('5'),
            strict_mute_everything_except_current: domElPpt('1'),
            muted_on_mouse_over: domElPpt(''),
            muted_on_any_mouse_interaction: domElPpt(''),
        },
        playStyle: {
            baseValues: basePpt('6'),
            strict_play_current_on_mouse_over: domElPpt('1'),
            play_on_mouse_over: domElPpt(''),
            visible_clips_start_to_play_unmuted: domElPpt(''),
        },
        range: {
            baseValues: basePpt('7'),
            /*seconds up to 60*/
            timestamp_display_scroll_offset: domElPpt('5'),
            /* integers from 0 to 100 */
            end_loop_sound_volume: domElPpt('50'),
        },
        InAndOutKeys: {
            baseValues: basePpt('7'),
            /* middle mouse button is on by default */
            ctrlKey: subPpt('1'),
            shiftKey: subPpt(''),
            altKey: subPpt(''),
        },
        defaultValues: {
            baseValues: basePpt('8'),
            video_volume: subPpt(40),
            /* 'dark' or 'light' */
            css_theme: subPpt('dark'),
            /* empty means 50% - only valid css units like px  %  vw */
            player_span: subPpt('50%'),
            /* distinguish between {{[[video]]:}} from {{[[yt-gif]]:}} or 'both' which is also valid*/
            override_roam_video_component: subPpt(''),
            /* src sound when yt gif makes a loop, empty if unwanted */
            end_loop_sound_src: subPpt('https://freesound.org/data/previews/256/256113_3263906-lq.mp3'),
        },
    }
    function basePpt(order = '0')
    {
        return {
            uid: '',
            order: order,
            string: '',
        }
    }
    function domElPpt(baseValue = '')
    {
        return {
            uid: '',
            domEl: '',
            string: '',
            baseValue: baseValue,
            sessionValue: null,
        }
    }
    function subPpt(baseValue = '')
    {
        return {
            uid: '',
            string: '',
            baseValue: baseValue,
            sessionValue: null,
        }
    }

    const newUID = await navigateToUiOrCreate(targetPage);
    await BrandNewInstallation(newUID);
    async function BrandNewInstallation(TargetUID)
    {
        for (const parentKey in window.UISettings)
        {
            const parentInfo = fmtSettings([parentKey]);
            const addedRoot = await createBlock(TargetUID, 100000, parentInfo.string, parentInfo.uid);

            window.UISettings[parentKey].uid = addedRoot.uid; // LEVEL 0
            window.UISettings[parentKey].string = addedRoot.string; // LEVEL 0

            for (const childKey in window.UISettings[parentKey])
            {
                for (const subKey in window.UISettings[parentKey][childKey]) // FIRST LEVEL > Sub properties
                {
                    if (subKey != 'sessionValue')
                        continue;

                    try
                    {
                        const baseValue = window.UISettings[parentKey][childKey].baseValue;

                        const SubPropertyInfo = fmtSettings([childKey, baseValue]);
                        const addedSubInfo = await createBlock(addedRoot.uid, 100000, SubPropertyInfo.string, SubPropertyInfo.uid);

                        window.UISettings[parentKey][childKey].uid = addedSubInfo.uid; // > LEVEL 1
                        window.UISettings[parentKey][childKey].string = addedSubInfo.string; // > LEVEL 1

                    }
                    catch (err)
                    {
                        debugger;
                    }
                }
            }
        }
    }
}
else
{

    const entirePageText = await GetAllNestedTextFromUID(TargetUID);

    console.log(entirePageText);
    console.log(window.UISettings);
}
return '';

async function GetAllNestedTextFromUID(UID)
{
    const ChildrenHierarchy = await getBlockOrPageInfo(UID, true);

    if (!ChildrenHierarchy)
    {
        return 'Page is empty';
    }

    //accumulativeString
    return await RecursiveReadAndAssignChildrenUIData(ChildrenHierarchy[0][0], '');
}



function fmtSettings(strArr = [])
{
    const manualUID = roamAlphaAPI.util.generateUID();
    const preBlockStr = [`(${manualUID})`, ...strArr];
    const blockStr = preBlockStr.join(' : ');
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
    let newUid = (!manualUID) ? roamAlphaAPI.util.generateUID() : manualUID;

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






async function RecursiveReadAndAssignChildrenUIData(nextObj, accStr, nextUID, keyFromLevel0)
{
    const { tab, nextStr, indent } = await NestedString(nextObj);
    const rgxBase = new RegExp(/\(([^\)]+)\)( : )(\b\w+\b)| |:|(\b.*\b)/, 'gm');
    const [whole, uid, join, key, optJoin, value] = rgxBase.exec(nextStr || 'hello');

    if (indent == 0) // LEVEL 0
    {
        if (RecIsValidNestedKey(window.UISettings, key))
        {
            window.UISettings[key].string = whole;
            window.UISettings[key].uid = uid;
        }
        else
        {
            if (uid || nextUID)
                await removingBlock(uid || nextUID);
        }

    }
    else if (indent == 1) // LEVEL 1
    {
        if (RecIsValidNestedKey(window.UISettings, keyFromLevel0, [key]))
        {
            window.UISettings[keyFromLevel0][key].string = whole;
            window.UISettings[keyFromLevel0][key].uid = uid;
        }
        else
        {
            await removingBlock(uid || nextUID);
        }
    }
    function RecIsValidNestedKey(obj, level, ...rest)
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
        if (whole == TargetUID) return; // the nature of the recursive func makes it so the page can't be avoided

        console.log(`"${whole}" <= invalid YT GIF setting! remving ... ${uid || 'the block'} `);
        await ccc.util.deleteBlock(uid);
    }

    accStr = accStr + '\n' + tab + nextStr;

    if (nextObj.children)
    {
        const object = await getBlockOrPageInfo(nextObj.uid);
        const children = sortObjectsByOrder(object[0][0].children);

        for (const child of children)
        {
            accStr = await RecursiveReadAndAssignChildrenUIData(child, accStr, uid, key);
        }
    }
    return accStr;
}
async function NestedString(obj)
{
    const nextStr = obj.string || obj.title || '';
    const parentsHierarchy = await getBlockParentUids(obj.uid);
    let nestLevel = parentsHierarchy.length;
    let tab = '\t';
    return {
        tab: tab.repeat(nestLevel),
        nextStr,
        indent: nestLevel,
    }
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
            await ccc.util.getOrCreatePageUid(destinationPage);
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

