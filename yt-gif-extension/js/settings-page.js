// version 1 - semi-refactored
const targetPage = 'roam/js/kauderk/yt-gif/settings';
const UTILS = window.kauderk.util;
const RAP = window.kauderk.rap;

let TARGET_UID = RAP.getPageUid(targetPage);

const fmtSplit = ' : ';
const cptrPrfx = '<',
    cptrSufx = '>';
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
    //n0_i0_c0_o0
    i0_c0_o0: {
        baseKey: addOrderPmt(`GREEN`),
        i1_c1_o0: {
            baseKey: addOrderPmt(`🐢 Turtle`),
            i2_c1_o0: {
                baseKey: addOrderPmt(`🦎 Lizard 🐲 Dragon Face`),
                i3_c1_o0: {
                    baseKey: addOrderPmt(`🌿 Herb ☘️ Shamrock 🍀 Four Leaf Clover`),
                },
            },
        },
        i1_c2_o1: {
            baseKey: addOrderPmt(`🌺 Hibiscus 🌻 Sunflower`),
        },
        i1_c3_o2: {
            baseKey: addOrderPmt(`🌺 Hibiscus 🌻 Sunflower`),
        },
    },
    i0_cx_o1: {
        baseKey: addOrder(chk),
        i1_cx_o0: dom('1'),
        i1_cx_o1: {
            baseKey: addOrder(chk),
            i2_cx_o0: dom('1'),
            i2_cx_o1: dom(),
            i2_cx_o2: dom('1'),
        },
        i1_cx_o2: dom('1'),
        i1_cx_o3: dom('1'),
    },
}

// THE ORDER DOES MATTER, because of the counter
//window.YT_GIF_SETTINGS_PAGE.Workflow.baseKey.string = `The first ${Object.keys(window.YT_GIF_SETTINGS_PAGE).length} blocks will be added/removed automatically. The last parameters are customizable. 👋`;


init();

async function init()
{
    //assignChildrenOrder(); // 🐌
    const result = await assignChildrenMissingValues();

    if (TARGET_UID == null) // Brand new installation
    {
        TARGET_UID = await RAP.navigateToUiOrCreate(targetPage);
        const addedBlocks = await addAllMissingBlocks(); // 🐌
    }
    else // Read and store Session Values
    {
        const entirePageText = await Read_Write_SettingsPage(TARGET_UID); // 🐌
        const addedBlocks = await addAllMissingBlocks(); // 🐌 // THEY WILL STACK UP AGAINS EACHOTHER IF THEY ARE NOT EXAMINED - careful, bud
    }
    await RAP.SetNumberedViewWithUid(TARGET_UID);
    //await RAP.CollapseDirectcChildren(TARGET_UID, false);
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
async function assignChildrenMissingValues()
{
    const passAccObj = {
        accStr: '',
        nextStr: '',
        indent: -1,
    };

    return await Rec_assignChildrenMissingValues(window.YT_GIF_SETTINGS_PAGE, passAccObj);
    async function Rec_assignChildrenMissingValues(nextObj, accObj = passAccObj)
    {
        let { accStr } = accObj;
        let funcOrder = -1;

        const { nextStr, indent } = accObj;
        const tab = `\t`.repeat((indent < 0) ? 0 : indent);

        accStr = accStr + '\n' + tab + nextStr;


        for (const property in nextObj)
        {
            if (nextObj.hasOwnProperty(property) && typeof nextObj[property] === "object" && nextObj[property] != null)
            {
                const nestedPpt = nextObj[property];

                const nextAccObj = {
                    indent: indent + 1,
                    accStr: accStr,
                    nextStr: nestedPpt.string || '',
                };

                accStr = await Rec_assignChildrenMissingValues(nextObj[property], nextAccObj);

                if (nestedPpt.baseKey != undefined) // the acutal main objects are set up so the main sub key (block) has it's properties nested, and below it's possible children, so to change it, you have to look one level above it
                {
                    nestedPpt.baseKey.order = Number(++funcOrder);
                    nestedPpt.baseKey.indent = nextAccObj.indent;
                }
                else if (nestedPpt.domEl != undefined)
                {
                    //debugger;
                    nestedPpt.order = Number(++funcOrder) - 1;
                    nestedPpt.indent = nextAccObj.indent;
                }
                else // nested on same indent
                {
                    const preOrder = Number(++funcOrder) - 2;
                    nestedPpt.order = (preOrder < 0) ? 0 : preOrder;
                    nestedPpt.indent = nextAccObj.indent;
                    console.log(property);
                }

                // so far it works for the first indentation, but with actual user inputs whey they get to a nested one, they skip one
            }
        }
        return accStr;
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
        const { uid, key, value, caputuredValue, caputureOk } = getUidKeywordsFromBlockString(nextStr);

        if (! await SuccessfulSttgUpt(indent)) // remove it
        {
            const uidToDelete = uid || nextUID;
            if (uidToDelete)
            {
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
                accStr = await Rec_Read_Write_SettingsPage(child, nextAccObj);
            }
        }

        return accStr;

        //#region local uitils
        async function SuccessfulSttgUpt(indent)
        {
            if (indent == 0)
            {
                if (RecIsValidNestedKey(window.YT_GIF_SETTINGS_PAGE, key)) // LEVEL 0 block upt
                {
                    let parentObj = window.YT_GIF_SETTINGS_PAGE[key];
                    const baseObj = assertObjPpt_base(parentObj.baseKey, nextStr, uid);

                    parentObj = assignInputTypesToChildren(parentObj);

                    await checkReorderBlock(parentUid, selfOrder, baseObj);

                    tryToCorrectWrittenUID(nextStr);

                    return true;
                }
            }
            else if (indent == 1)
            {
                if (RecIsValidNestedKey(window.YT_GIF_SETTINGS_PAGE, keyFromLevel0, [key])) // nested LEVEL 1 block upt
                {
                    const crrObjKey = assertObjPpt_base(window.YT_GIF_SETTINGS_PAGE[keyFromLevel0][key], nextStr, uid);

                    crrObjKey.sessionValue = value;
                    crrObjKey.caputuredValue = caputuredValue;
                    if (!caputureOk)
                    {
                        console.warn(`BUD bud - "${nextStr}" value is looking weird, it will default to false...`);
                    }
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

                            if (typeof childType == 'undefined')
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
                    debugger;
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
        function getUidKeywordsFromBlockString(nextStr, join = fmtSplit)
        {
            const rgxUid = new RegExp(/\(([^\)]+)\)/, 'gm'); //(XXXXXXXX)
            let splitedStr = nextStr.split(join); // deconstruct
            const everyFirstKeyword = splitedStr.map(word => word.split(' ')[0]); // returns array

            const preUid = rgxUid.exec(everyFirstKeyword[0]);

            const { value, caputureOk } = tryTrimCapturedValue(everyFirstKeyword[2] || '');

            return {
                uid: preUid ? preUid[1] : undefined,

                key: everyFirstKeyword[1],

                caputuredValue: everyFirstKeyword[2],
                value: value,
                caputureOk: caputureOk,
            }
            function tryTrimCapturedValue(string)
            {
                const prefix = string.substring(0, 1);
                const suffix = string.substring((string.length - 1), string.length);
                if (prefix == cptrPrfx && suffix == cptrSufx)
                {
                    // < >
                    return {
                        caputuredValue: string.substring(1, string.length - 1),
                        caputureOk: true,
                    }
                }
                return {
                    caputuredValue: string,
                    caputureOk: false,
                }
            }
        }
        function tryToCorrectWrittenUID(blockStr)
        {

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

                    accHierarchyUids: UTILS.pushSame(accObj.accHierarchyUids, ...HierarchyUids), // this is weird

                    accStr: accStr,
                    tab: `\t`.repeat(0),
                    nextStr: nestedPpt.string || '',
                };


                accStr = await Rec_addAllMissingBlocks(nextObj[property], nextAccObj); // recursion with await - 🤯

                // 3. indent = 1
                try
                {
                    if (nextObj[property].baseValue != undefined) // arbitrary property -> subTemp()
                    {
                        const value = nestedPpt.sessionValue = nestedPpt.baseValue;
                        const caputuredValue = nextObj[property].caputuredValue = `<${value}>`;

                        const manualStt = {
                            m_uid: HierarchyUids[HierarchyUids.length - 1], // parent key to create under
                            m_strArr:
                                [
                                    nextAccObj.accKeys[nextAccObj.accKeys.length - 1],
                                    caputuredValue
                                ], // "key_description" : "<value>"
                            m_order: nestedPpt.order,
                        }

                        nestedPpt = await TryToCreateUIblock(nestedPpt, manualStt);
                    }
                }
                catch (err)
                {
                    debugger;
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
            //#endregion
        }
    }
}
function assertObjPpt_base(baseKeyObj, string, uid)
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
    return baseTmp(pmt, blockContent);
}
/*---------------------------------------------*/
function addOrder(inputType)
{
    return baseTmp(inputType);
}
function dom(baseValue = '', inputType)
{
    const domObj = { domEl: '' }
    return Object.assign(subTemp(baseValue, inputType), domObj);
}
function subInputType(baseValue = '', inputType)
{
    return subTemp(baseValue, inputType);
}
/*---------------------------------------------*/
function subTemp(baseValue = '', inputType)
{
    const subSub = {
        baseValue: baseValue,
        sessionValue: null,
        caputuredValue: '<>',
    }
    return Object.assign(baseTmp(inputType), subSub);
}
function baseTmp(_inputType, _string = '')
{
    return {
        uid: '',
        string: _string,
        examined: false,
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