<?php
$sub_menu = "600250";
include_once('./_common.php');

check_demo();

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
auth_check($auth[$sub_menu], 'w');


$name = $_POST['name'];
$css_file_str = $_POST['file_css'];
$css_file = stripslashes($css_file_str);

$html_file_str = $_POST['file_html'];
$html_file_str_re = str_replace('</ textarea>','</textarea>',$html_file_str);
$html_file = stripslashes($html_file_str_re);


$common_dir = G5_THEME_PATH."/skin/latest/".$name."/";

// 내용 업데이트
$file_css = fopen($common_dir."style.css","w");
fwrite($file_css, $css_file);
fclose($file_css);

$file_html = fopen($common_dir."latest.skin.php","w");
fwrite($file_html, $html_file);
fclose($file_html);


$common_dir = G5_THEME_PATH."/skin/latest/".$name.'/img';
if(!is_dir($common_dir)){
  mkdir($common_dir);
}

// 이미지 삭제
for ($i=0; $i<count($_POST['img_del']); $i++) {
  @unlink(G5_THEME_PATH."/skin/latest/".$name."/img/".$_POST['img_del'][$i]);
}

// 이미지 업로드
for ($k=0; $k<count($_FILES['img_up']['name']); $k++) {
  $dest_path = G5_THEME_PATH."/skin/latest/".$name."/img/".$_FILES['img_up']['name'][$k];
  @move_uploaded_file($_FILES['img_up']['tmp_name'][$k], $dest_path);
}


// 업데이트 완료후 페이지 이동
goto_url('./latest_skin_edit.php?name='.$name, false);
?>
