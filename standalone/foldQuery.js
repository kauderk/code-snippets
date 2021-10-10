
let qry = document.querySelectorAll(".rm-query");

//recursive | 16th line
let folding = async (idx)=>{
  let arrows = qry[idx].querySelectorAll("span.bp3-icon-standard.bp3-icon-caret-down.rm-caret.rm-caret-open.rm-caret-showing.dont-focus-block");
  let showMore = qry[idx].querySelectorAll(".rm-reference-main.rm-query-content > div.flex-h-box.flex-align-center > button");
  showMore = showMore[showMore.length-1];
  
  if(showMore)
  {
    fold(arrows);
    showMore.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
	
    folding(idx);
  }
  else fold(arrows);
  
}
let fold = (arrows)=>{
  for (let i=0; i < arrows.length; i++){
    if(!arrows[i].closest(".rm-query-title"))
      arrows[i].click();
  }
}

for (let i=0; i < qry.length; i++){
  folding(i);
}


return "";