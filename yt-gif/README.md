# yt-gif-tsc

- Typescript project
- Compiled using the "umd" format
- Based on the original [yt-gif-extension](https://github.com/kauderk/kauderk.github.io/blob/main/yt-gif-extension/v0.2.0/js/yt-gif-app.js) (single file app)
	- This project is a ground up refactored version.

## why?

To improve the development experience. Now the project is ES Module ready, which means is modular by default and hopefully open for extension.

---
<br>
<br>

<details>
<summary>▽▽▽▽▽▽▽▽▽▽▽<h2>How to install</h2></summary>
<br>

You can find more information on the [original page](https://github.com/kauderk/kauderk.github.io/tree/main/yt-gif-extension/install).<br>
***Also don't forget to disable all previous versions.***
<br><br>

```js
/*
How do I use it? -> https://github.com/kauderk/kauderk.github.io/blob/main/yt-gif-extension/install/faq/README.md#how-do-i-use-it
Example ⬇️
{{[[yt-gif]]: https://youtu.be/sFFwvr6l2mM?t=60&end=120 }}
*/

var existing = document.getElementById('yt-gif-main');
if (!existing) 
{
	var extension = document.createElement("script");
	extension.src = "https://kauderk.github.io/code-snippets/yt-gif/roamresearch/prod/yt-gif-app.js";
	extension.id = "yt-gif-main";
	extension.async = true;
	extension.type = "text/javascript";
	document.getElementsByTagName("head")[0].appendChild(extension);
}
```
</details>

---
<br>
<br>

## what problems does it solve?

<details>
<summary>A <strong>single entry point</strong> of failure.</summary>
<br>
Reading values from the YouTube Iframe API was troublesome
<br><br>

They change the API values & property paths on a regular basis.
Because of the monolithic nature of the single-file-app. 
Keeping track of the changes is [dangerous and repetitive](https://kauderk.github.io/yt-gif-extension/v0.2.0/js/yt-gif-app.js#:~:text=async%20function%20onPlayerReady(event)).


Now all the API requests get dispatched from a [single object](https://github.com/kauderk/yt-gif-monorepo/blob/main/packages/yt-gif/src/v0.3.0/lib/types/yt-types.ts#:~:text=%7D-,GetIframeID,-%3A%20FString%20%3D) (per instance though).

From the user point of view it would look something like this: the **video** and the **UI** would load, but the actual video wouldn't respond at all. This happens because the script is reading outdated data.

Now if someone were to report something similar, it'll be much easier to solve and debug.
</details>

---
<br>
<br>

## Troubleshooting

<details>
<summary>I'm experimenting problems with this build</summary>
<br>

***Change to development mode***

This deployment ships with `yt-gif/roamresearch/dev` (development) and `yt-gif/roamresearch/prod` (production) builds.
<br><br>

If someone were to find errors or bugs, changing the extension source:
```js
// ...
// notice: it went from /dev/ to /prod/
extension.src = "https://kauderk.github.io/code-snippets/yt-gif/roamresearch/prod/yt-gif-app.js";
// ...
```
Will output more comprehensive error descriptions.

- But, why doing it this way?
The `development` build is way lighter than the `production` build. Which means faster load times.

</details>

<br>

<details>
<summary>I'm experimenting random errors</summary>

***Create an [github issue](https://github.com/kauderk/code-snippets/issues/new?assignees=&labels=&template=bug_report.md&title=)*** or explain the problem through [twitter](https://twitter.com/kauDerk_).

- Some examples and what to do:
	- The most common errors are the `feature compatibility` ones, for example: Safari doesn't support `Regex's LookAhead and LookBehind`, thus now there's a [counter measurement](https://github.com/kauderk/yt-gif-monorepo/commit/780eb65ecc99d9aff6606aa8d0986122eef6f22a) for that.
	- Others will be `run time errors`, and for those if you're running the `production` build, the `trace-call (log)` will look like *gibberish*. So, to fix them or at least understand the context change the build to `development`.
- Keep in mind this build is being tested on a high level using `"@playwright/test": "^1.27.1"` targeting `Safari`, `Chromium` and `Firefox` browsers. Though the main development was on a Chrome Browser.

</details>

---
<br>
<br>
