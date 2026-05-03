<?php
$sub_menu = "600300";
include_once('./_common.php');

check_demo();

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
auth_check($auth[$sub_menu], 'w');


$name = $_POST['name'];
$mode = $_POST['mode'];

if($mode == 'css'){
// css 파일 업데이트
$css_file_str = $_POST['file'];
$css_file = stripslashes($css_file_str);

$common_css_dir = G5_THEME_PATH."/css/";

$file_css = fopen($common_css_dir.$name,"w");
fwrite($file_css, $css_file);
fclose($file_css);
}

if($mode == 'js'){
// js 파일 업데이트
$js_file_str = $_POST['file'];
$js_file = stripslashes($js_file_str);

$common_js_dir = G5_THEME_PATH."/js/";

$file_js = fopen($common_js_dir.$name,"w");
fwrite($file_js, $js_file);
fclose($file_js);
}

// 완료 알림
alert($name.'파일을 업데이트 했습니다.');
// 업데이트 완료후 페이지 이동
goto_url('./block_setup_edit.php?name='.$name, false);
?>
