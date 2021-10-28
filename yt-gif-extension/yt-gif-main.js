LoadExternalResources();

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

        const ytApiScript = loadYT_IFRAME_API();

        promises.push(createXload('utils.js'));

        promises.push(createXload('utils-roam-alpha-api.js'));

        promises.push(createXload('settings-page.js'));

        promises.push(createXload('app.js'));


        await Promise.all([loadScript(ytApiScript), ...promises]);

        return null;
    }
    async function createXload(src)
    {
        const obj = {
            src: src,
            id: `yt-gif-${src}`
        }
        const script = createScript(obj);
        return await loadScript(script);
    }
    function loadYT_IFRAME_API()
    {
        const YTAPI = document.createElement('script');
        YTAPI.src = 'https://www.youtube.com/player_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(YTAPI, firstScriptTag);
        return YTAPI;
    }
    async function loadScript(script)
    {
        return new Promise((resolve, reject) =>
        {
            script.onload = () => resolve(script)
        })
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