
init();
async function init()
{
    await LoadExternalResources();
    await createXload('app.js');
}

async function LoadExternalResources()
{
    if (
        typeof kauderk !== 'undefined' &&
        typeof kauderk.util !== 'undefined' &&
        typeof (kauderk.RAP) != 'undefined' &&
        typeof (YT) != 'undefined'
    )
    {
        return null;
    }
    else
    {
        let promises = [];

        loadScript(loadYT_IFRAME_API());

        await createXload('utils.js');

        await createXload('utils-roam-alpha-api.js');

        await createXload('settings-page.js');

        //await Promise.all([, ...promises]);

        return null;
    }
    function loadYT_IFRAME_API()
    {
        const YTAPI = document.createElement('script');
        YTAPI.src = 'https://www.youtube.com/player_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(YTAPI, firstScriptTag);
        return YTAPI;
    }
}
async function loadScript(script)
{
    return new Promise((resolve, reject) =>
    {
        script.onload = () => resolve(script)
    })
}
async function createXload(src)
{
    const obj = {
        src: src,
        id: `script-yt-gif-${src}`
    }

    romoveIfany(obj.id);
    const script = createScript(obj);
    return await loadScript(script);

    function romoveIfany(id)
    {
        const scriptAlready = document.querySelectorAll(`[id='${id}']`);
        if (scriptAlready) // well well well - we don't like duplicates - lol
        {
            for (const el of scriptAlready)
            {
                el.parentElement.removeChild(el);
            }
        }
    }
    function createScript({ src, id })
    {
        const script = document.createElement("script");
        script.src = URLFolderJS(src) + "?" + new Date().getTime();
        script.id = id;
        script.type = "text/javascript";
        document.getElementsByTagName('head')[0].appendChild(script);
        return script;
        function URLFolderJS(f)
        {
            return `https://kauderk.github.io/code-snippets/yt-gif-extension/js/${f}`
        };
    }
}