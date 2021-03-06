
(async function ()
{
    await LoadExternalResources();
    await window.YT_GIF_SETTINGS_PAGE_INIT();
    await createXload('yt-gif-app.js');
})();

async function LoadExternalResources()
{
    if (
        typeof kauderk !== 'undefined' &&
        typeof kauderk.util !== 'undefined' &&
        typeof (kauderk.rap) != 'undefined' &&
        typeof (YT) != 'undefined'
    )
    {
        return null;
    }
    else
    {
        await loadYT_IFRAME_API();

        await createXload('utils.js');

        await createXload('utils-roam-alpha-api.js');

        await createXload('settings-page.js');

        return null;
    }
    function loadYT_IFRAME_API()
    {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/player_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
        return new Promise((resolve, reject) => { script.onload = () => resolve(script) })
    }
}
async function createXload(src)
{
    const obj = {
        src: src,
        id: `script-yt_gif-${src}`
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
        script.async = false;
        script.type = "text/javascript";
        document.getElementsByTagName('head')[0].appendChild(script);
        return script;
        function URLFolderJS(f)
        {
            return `https://kauderk.github.io/code-snippets/yt-gif-extension/js/${f}`
        };
    }
    async function loadScript(script)
    {
        return new Promise((resolve, reject) =>
        {
            //Script finished loading
            script.addEventListener('load', () => resolve(script))
        })
    }
}