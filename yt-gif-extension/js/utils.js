if (typeof kauderk !== 'undefined')
{
    loadYTGIFUtils();
    return;
}
let kauderk = window.kauderk || {};

function loadYTGIFUtils()
{
    kauderk.util = ((util) =>
    {
        util.RemoveElsEventListeners = (withEventListeners) =>
        {
            for (const el of withEventListeners)
            {
                el.replaceWith(el.cloneNode(true));
            }
        };

        util.print = (str = 'hi') =>
        {
            console.log(str);
        };

        // linearly maps value from the range (a..b) to (c..d)
        util.mapRange = (value, a, b, c, d) =>
        {
            // first map value from (a..b) to (0..1)
            value = (value - a) / (b - a);
            // then map it from (0..1) to (c..d) and return it
            return c + value * (d - c);
        };

        util.linkClickPreviousElement = (el) =>
        {
            el.previousElementSibling.setAttribute('for', el.id); // link clicks
        };

        util.applyIMGbg = (wrapper, url) =>
        {
            wrapper.style.backgroundImage = `url(${util.get_youtube_thumbnail(url)})`;
        };
        util.removeIMGbg = (wrapper) =>
        {
            wrapper.style.backgroundImage = 'none';
        };


        util.NoCash = (url) =>
        {
            return url + "?" + new Date().getTime();
        };


        util.inViewport = (els) =>
        {
            let matches = [], elCt = els.length;

            for (let i = 0; i < elCt; ++i)
            {
                let el = els[i], b = el.getBoundingClientRect(), c;

                if (b.width > 0 && b.height > 0 &&
                    b.left + b.width > 0 && b.right - b.width < window.outerWidth &&
                    b.top + b.height > 0 && b.bottom - b.width < window.outerHeight &&
                    (c = window.getComputedStyle(el)) &&
                    c.getPropertyValue('visibility') === 'visible' &&
                    c.getPropertyValue('opacity') !== 'none')
                {
                    matches.push(el);
                }
            }
            return matches;
        };





        util.emptyEl = (classList, el) =>
        {
            if (classList)
                el.classList.add(classList);
            return el;
        };
        util.toggleClasses = (bol, classNames, el) =>
        {
            if (bol)
            {
                el.classList.add(...classNames);
            }

            else
            {
                el.classList.remove(...classNames);
            }
        };


        util.exitFullscreen = () =>
        {
            if (document.exitFullscreen)
            {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen)
            {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen)
            {
                document.webkitExitFullscreen();
            }
        };
        util.closestBlockID = (el) =>
        {
            return el?.closest('.rm-block__input')?.id;
        };
        util.allIframeIDprfx = () =>
        {
            return document.querySelectorAll(`[id*=${iframeIDprfx}]`);
        };
        util.allIframeStyle = (style) =>
        {
            return document.querySelectorAll(`[${style}]`);
        };



        util.isTrue = (value) =>
        {
            if (typeof (value) === 'string')
                value = value.trim().toLowerCase();

            switch (value)
            {
                case true:
                case 'true':
                case 1:
                case '1':
                case 'on':
                case 'yes':
                    return true;
                default:
                    return false;
            }
        };
        util.isValidUrl = (value) =>
        {
            return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
        };
        util.isValidFetch = async (url) =>
        {
            try
            {
                const response = await fetch(url, { cache: "no-store" });
                if (!response.ok)
                    throw new Error('Request failed.');
                return [response, null];
            }
            catch (error)
            {
                console.log(`Your custom link ${url} is corrupt. ;c`);
                return [null, error];
            };
        };
        util.FetchText = async (url) =>
        {
            const [response, err] = await util.isValidFetch(util.NoCash(url)); // firt time fetching something... This is cool
            if (response)
                return await response.text();
        };
        util.get_youtube_thumbnail = (url, quality) =>
        {
            //https://stackoverflow.com/questions/18681788/how-to-get-a-youtube-thumbnail-from-a-youtube-iframe
            if (url)
            {
                var video_id, thumbnail, result;
                if (result = url.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/))
                {
                    video_id = result.pop();
                }
                else if (result = url.match(/youtu.be\/(.{11})/))
                {
                    video_id = result.pop();
                }

                if (video_id)
                {
                    if (typeof quality == "undefined")
                    {
                        quality = 'high';
                    }

                    var quality_key = 'maxresdefault'; // Max quality
                    if (quality == 'low')
                    {
                        quality_key = 'sddefault';
                    } else if (quality == 'medium')
                    {
                        quality_key = 'mqdefault';
                    } else if (quality == 'high')
                    {
                        quality_key = 'hqdefault';
                    }

                    var thumbnail = "https://img.youtube.com/vi/" + video_id + "/" + quality_key + ".jpg";
                    return thumbnail;
                }
            }
            return false;
        };


        util.isValidCSSUnit = (value) =>
        {
            //  valid CSS unit types
            const CssUnitTypes = ['em', 'ex', 'ch', 'rem', 'vw', 'vh', 'vmin',
                'vmax', '%', 'cm', 'mm', 'in', 'px', 'pt', 'pc'];

            // create a set of regexps that will validate the CSS unit value
            const regexps = CssUnitTypes.map((unit) =>
            {
                // creates a regexp that matches '#unit' or '#.#unit' for every unit type
                return new RegExp(`^[0-9]+${unit}$|^[0-9]+\\.[0-9]+${unit}$`, 'i');
            });

            // attempt to find a regexp that tests true for the CSS value
            const isValid = regexps.find((regexp) => regexp.test(value)) !== undefined;

            return isValid;
        };

        util.ChangeElementType = (element, newtype) =>
        {
            let newelement = document.createElement(newtype);

            // move children
            while (element.firstChild)
                newelement.appendChild(element.firstChild);

            // copy attributes
            for (var i = 0, a = element.attributes, l = a.length; i < l; i++)
            {
                newelement.attributes[a[i].name] = a[i].value;
            }

            // event handlers on children will be kept. Unfortunately, there is
            // no easy way to transfer event handlers on the element itself,
            // this would require a full management system for events, which is
            // beyond the scope of this answer. If you figure it out, do it here.
            element.parentNode.replaceChild(newelement, element);
            return newelement;
        };



        return util;
    })(kauderk.util || {});
}
