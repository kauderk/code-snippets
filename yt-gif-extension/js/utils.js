let kauderk = window.kauderk || {};
kauderk.util = ((newUtil) =>
{
    newUtil.print = (str) =>
    {
        console.log(str);
    }
    return newUtil;
})(kauderk.util || {});