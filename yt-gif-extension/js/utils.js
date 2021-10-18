let kauderk = window.kauderk || {};
kauderk.util = ((newUtil) =>
{
    newUtil.print = (str = 'hi') =>
    {
        console.log(str);
    }
    return newUtil;
})(kauderk.util || {});