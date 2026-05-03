<?php
include_once('_common.php');
// 블럭값
$blcok_name = $_GET['name'];
$g5['title'] = $blcok_name.'미리보기';
include_once(G5_THEME_PATH.'/head.sub.php');
include_once(G5_LIB_PATH.'/latest.lib.php');

// 기본 레이아웃 스타일
include_once(G5_THEME_PATH.'/basic_css.php');
echo '<div id="viewCapture">';
echo '<div class="container">';
echo latest('theme/'.$blcok_name,'free',8,28);
echo '</div>';
echo '</div>';
include_once(G5_THEME_PATH.'/tail.sub.php');
?>
