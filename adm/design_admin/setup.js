var hostname = window.location.hostname;
function addJavascript(jsname) {
	var th = document.getElementsByTagName('head')[0];
	var s = document.createElement('script');
	s.setAttribute('src',jsname);
	th.appendChild(s);
}
function addStylesheet(cssname) {
	var s = '<link rel="stylesheet" href="'+cssname+'">';
	$("head").append(s);
}
function addDevicemeta(){
	var th = document.getElementsByTagName('head')[0];
	var s = document.createElement('meta');
	s.setAttribute('name','viewport');
	s.setAttribute('content','width=device-width,initial-scale=1.0,minimum-scale=0,maximum-scale=10,user-scalable=yes');
	th.appendChild(s);
}
addDevicemeta();
addStylesheet('http://'+hostname+'/adm/design_admin/css/uikit.min.css');
addStylesheet('http://'+hostname+'/adm/design_admin/css/admin.css');
addJavascript('http://'+hostname+'/adm/design_admin/js/uikit.min.js');
addJavascript('http://'+hostname+'/adm/design_admin/js/admin.js');

// 쇼핑몰 기능 사용할지 안할지 설정. (사용:true / 사용안함:false)
var shop_set = true;
if(shop_set==false){
	$('.gnb_ul .menu-400').hide();
	$('.gnb_ul .menu-500').hide();
}
