function Rec_findObj(keyCheck)
{
    for (const key in window.YT_GIF_SETTINGS_PAGE)
    {
        const firstLevelObj = window.YT_GIF_SETTINGS_PAGE[key];
        if (key == keyCheck)
        {
            return { ok: true, rest: [], firstLevelObj, level: key };
        }
        for (const subKey in firstLevelObj)
        {
            const validKey = RecIsValidNestedKey(firstLevelObj, subKey);
            if (validKey.level == keyCheck)
            {
                return validKey;
            }
        }
    }
    function RecIsValidNestedKey(obj, level, ...rest) // 🐌
    {
        //console.log("hi");
        if (obj === undefined) 
        {
            return { ok: false, obj }
        }
        if (rest.length == 0 && obj.hasOwnProperty(level))
        {
            return { ok: true, rest, obj, level }
        }
        return RecIsValidNestedKey(obj[level], ...rest)
    }
}
function Rec_findObj(keyCheck)
{
    return Rec_deeperObjFinding(window.YT_GIF_SETTINGS_PAGE, {});
    function Rec_deeperObjFinding(nextObj, accObj)
    {
        for (const property in nextObj)
        {
            if (nextObj.hasOwnProperty(property) && typeof nextObj[property] === "object" && nextObj[property] != null)
            {
                if (property == keyCheck)
                {
                    return accObj = {
                        ok: true,
                        rest: [],
                        foundObj: nextObj[property],
                        level: property
                    };
                }
                else
                {
                    console.log('loop', property);
                    accObj = Rec_deeperObjFinding(nextObj[property], accObj);
                }
            }
        }
        return accObj;
    }
}
Rec_findObj('joins')

function getObjeByKey(keyCheck)
{
    const passAccObj = {
        accStr: '',
        nextStr: '',
        indent: -1,
    };

    return Rec_getObjeByKey(window.YT_GIF_SETTINGS_PAGE, passAccObj);
    function Rec_getObjeByKey(nextObj, accObj = passAccObj)
    {
        let { accStr } = accObj;

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
                if (property != keyCheck)
                {
                    accStr = Rec_getObjeByKey(nextObj[property], nextAccObj);
                }
                else
                {
                    return accStr;
                }
            }
        }
        return accStr;
    }
}

/*
const toDebugObj = {
    Workflow: {
        baseKey: addOrderPmt(`GREEN`),
        a1: {
            baseKey: addOrderPmt(`💐 Bouquet 🌸 Cherry Blossom`),
        },
        a2: {
            baseKey: addOrderPmt(`💮 White Flower 🏵️ Rosette`),
        },
        a3: {
            baseKey: addOrderPmt(`🌹 Rose 🥀 Wilted Flower`),
        },
        a6: {
            baseKey: addOrderPmt(`🐢 Turtle`),
            a: {
                baseKey: addOrderPmt(`🦎 Lizard 🐲 Dragon Face`),
                a: {
                    baseKey: addOrderPmt(`🌿 Herb ☘️ Shamrock 🍀 Four Leaf Clover`),
                },
            },
        },
        a4: {
            baseKey: addOrderPmt(`🌺 Hibiscus 🌻 Sunflower`),
        },
        a5: {
            baseKey: addOrderPmt(`🌼 Blossom 🌷 Tulip`),
        },
        a7: {
            baseKey: addOrderPmt(`🐍 Snake`),
        }
    },
    two: {
        baseKey: addOrderPmt(`WHITE`),
        b: {
            baseKey: addOrderPmt(`🐭 Mouse Face`),
            b: {
                baseKey: addOrderPmt(`🦊Fox 🦝Raccoon`),
                b: {
                    baseKey: addOrderPmt(`🐀 Rat 🐹 Hamster 🐇Rabbit`),
                    b: {
                        baseKey: addOrderPmt(`🐵 Monkey Face 🐒 Monkey 🦍 Gorilla 🦧 Orangutan`),
                        b: {
                            baseKey: addOrderPmt(`🦃 Turkey 🐔 Chicken 🐓 Rooster 🐣 Hatching Chick 🐤 Baby Chick `),
                            b: {
                                baseKey: addOrderPmt(`🐥 Baby Chick 🐦 Bird 🐧 Penguin 🐟 Fish 🐠 Tropical Fish 🐡 Blowfish`),
                                b: {
                                    baseKey: addOrderPmt(`🐎 Horse 🦄 Unicorn 🦓 Zebra 🦌 Deer 🦬 Bison 🐮 Cow Face 🐂 Ox`),
                                },
                            },

                        },
                    },
                },
            },
        },
        a: {
            baseKey: addOrderPmt(`🐘 Elephant`),
            a: {
                baseKey: addOrderPmt(`🦏 Rhinoceros 🦛 Hippopotamus`),
            },
        },
    },
}

const mainObj = {
    previousTimestamp: {
        baseKey: addOrder(rad),
        // one a time
strict_start_timestamp: dom('1'),
    start_timestamp: dom(),
        fixed_start_timestamp: dom(),
    },
previousVolume: {
    baseKey: addOrder(rad),
        // one a time
        strict_start_volume: dom('1'),
            start_volume: dom(),
                fixed_start_volume: dom(),
                    InAndOutKeys: {
        baseKey: addOrder(chk),
            // middle mouse button is on by default
            ctrlKey: dom('1'),
                shiftKey: dom(),
                    altKey: dom(),
        },
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
        //seconds up to 6
        timestamp_display_scroll_offset: dom('5', int),
            // integers from 0 to 100
            end_loop_sound_volume: dom('50', int),
                defaultValues: {
        baseKey: addOrder(),
            video_volume: subInputType(40, int),

                // 'dark' or 'light'
                css_theme: subInputType('dark', str),

                    // empty means 50% - only valid css units like px  %  vw
                    player_span: subInputType('50%', str),

                        // distinguish between {{[[video]]:}} from {{[[yt-gif]]:}} or 'both' which is also vali
                        override_roam_video_component: subInputType('', [bol, str]),

                            // src sound when yt gif makes a loop, empty if unwanted
                            end_loop_sound_src: subInputType('https://freesound.org/data/previews/256/256113_3263906-lq.mp3', url),
        },
},
InAndOutKeys: {
    baseKey: addOrder(chk),
        // middle mouse button is on by default
        ctrlKey: dom('1'),
            shiftKey: dom(),
                altKey: dom(),
    },
defaultValues: {
    baseKey: addOrder(),
        video_volume: subInputType(40, int),

            // 'dark' or 'light'
            css_theme: subInputType('dark', str),

                // empty means 50% - only valid css units like px  %  vw
                player_span: subInputType('50%', str),

                    // distinguish between {{[[video]]:}} from {{[[yt-gif]]:}} or 'both' which is also vali
                    override_roam_video_component: subInputType('', [bol, str]),

                        // src sound when yt gif makes a loop, empty if unwanted
                        end_loop_sound_src: subInputType('https://freesound.org/data/previews/256/256113_3263906-lq.mp3', url),
    },
}

const d3 = {
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
        i1_cx_o1: dom('1'),
        i1_cx_o2: dom('1'),
        i1_cx_o3: {
            baseKey: addOrder(chk),
            i2_cx_o0: dom('1'),
            i2_cx_o1: dom(),
            i2_cx_o2: dom('1'),
        },
        i1_cx_o4: dom('1'),
    },
}

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



//debugger;
// if (accObj.previousOrder > 0)
//     console.log({ previousOrder: accObj.previousOrder, inlineOrder: nestedPpt.order, previousPptName: accObj.previousPptName });
// const validPreInlineOrder = (funcInlineOrder < 0) ? 1 : funcInlineOrder;
// const preOrder = funcBaseKeyOrder = funcBaseKeyOrder + 2 + validPreInlineOrder;
// else // nested on same indent
// {
//     const preOrder = Number(++funcOrder) - 1;
//     nestedPpt.order = (preOrder < 0) ? 0 : preOrder;
//     nestedPpt.indent = nextAccObj.indent;
//     console.log(property, preOrder);
// }
// so far it works for the first indentation, but with actual user inputs whey they get to a nested one, they skip one


 */