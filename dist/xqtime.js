!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.xqtime=t():e.xqtime=t()}(self,(()=>({friend:function(e=new Date,t=!1){let n,o,f=((new Date).getTime()-new Date(e).getTime())/1e3,r=[60,3600,86400,2592e3,31536e3,31536e5,31536e6,31536e7,31536e11];for(let e=0;e<r.length;e++)if(f<r[e]){n=e,o=0===e?0:f/r[e-1];break}o=parseInt(o);let i={show:"",append:""};return i.show=function(e,t){let n=["刚刚","分钟前","小时前","天前","月前","年前","世纪前","千年前","万年前","亿年前"];return 0==e?n[0]:`${t}${n[e]}`}(n,o),t&&(i.append=function(e,t){let n=new Date(t),o=n.getSeconds(),f=n.getMinutes(),r=n.getHours(),i=n.getDay(),$=n.getMonth();o=o<10?`0${o}`:o,f=f<10?`0${f}`:f,r=r<10?`0${r}`:r,i=i<10?`0${i}`:i,$=$<10?`0${$}`:$+1;let p={3:`${r}:${f}:${o}`,5:`${$}-${i}`,6:`${n.getFullYear()}-${$}-${i}`},s="";for(const t in p)if(e<t){s=p[t];break}return s}(n,e)),t?`${i.show}(${i.append})`:i.show}})));