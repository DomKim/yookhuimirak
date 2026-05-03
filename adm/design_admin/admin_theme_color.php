<?php
$admin_theme = $_COOKIE['admin-color-theme'];

if($admin_theme == 'color-theme-01'){ unset($_COOKIE["admin-color-theme"]);}
if($admin_theme == 'color-theme-02'){ $theme_bg = '#373737'; $menu_font_color = '#a1a1a1';}
if($admin_theme == 'color-theme-03'){ $theme_bg = '#d01395'; $menu_font_color = '#e8e8e8';}
if($admin_theme == 'color-theme-04'){ $theme_bg = '#916EFC'; $menu_font_color = '#ececec';}
if($admin_theme == 'color-theme-05'){ $theme_bg = '#026E94'; $menu_font_color = '#fff';}
if($admin_theme == 'color-theme-06'){ $theme_bg = '#ec4500'; $menu_font_color = '#e3e3e3';}

if($admin_theme){
  $uk_offcanvas_bar = $theme_bg;
  $uk_nav_sub = 'rgba(255, 255, 255, 0.2)';
  $select_menu_color = '#fff';
  $admin_underLine = 'border-bottom:1px solid rgba(255,255,255,0.3);';
}else{
  $uk_nav_sub = 'rgba(0, 0, 0, 0.1)';
  $admin_underLine = 'border-bottom:1px solid #e3e3e3;';
}
if($admin_theme){
?>
<style>
.uk-offcanvas-bar {
  background: <?=$uk_offcanvas_bar?>;
}
.side-profile .inner {
  background: <?=$uk_nav_sub?>;
}
ul.uk-nav-sub {
  background: <?=$uk_nav_sub?>;
}
.uk-open>a {
  color:<?=$select_menu_color?> !important;
}
.uk-nav-default .uk-nav-sub li a{
  color:rgba(255, 255, 255, 0.6) !important;
}
.uk-offcanvas-bar a {
  color:<?=$menu_font_color?> !important;
}
.scroll-top {
  background: <?=$uk_offcanvas_bar?>;
  border:1px solid <?=$uk_offcanvas_bar?>;
}
.site-title {
  color:<?=$menu_font_color?>;
}
.uk-nav-sub li .on {
  background: rgba(244, 244, 244, 0.2);
}
.uk-nav-sub ul {
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.3) inset,0px 0px 0px rgba(200,200,200,0.2);
}
.header {background:<?=$theme_bg?> !important; <?php if($admin_theme!='color-theme-01'){echo 'border-bottom:0px;';}?> }
.header a {color:<?=$menu_font_color?> !important;}
.uk-breadcrumb>:last-child>* {color:<?=$menu_font_color?> !important;}

.hide-menu{background:#000; opacity: 0.5;color:<?=$menu_font_color?>}
</style>
<?php }?>
