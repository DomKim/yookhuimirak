<?php
$sub_menu = "700300";
include_once('./_common.php');

check_demo();

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');

check_admin_token();



$common_dir = G5_THEME_PATH; // 경로지정

//////////////////////////////////////////////////////////////////
// 워터마크 이미지 업로드.
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "파일업로드") {

  $dest_path = $common_dir."/act/";

  if ($_FILES['file_upload']['name']){
    @move_uploaded_file($_FILES['file_upload']['tmp_name'], $dest_path.'watermark.gif');
  }

  alert('워터마크 이미지를 업로드 했습니다.');
}

//////////////////////////////////////////////////////////////////
// 워터마크 이미지 삭제.
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "파일삭제") {
  @unlink($common_dir.'/robots.txt');
  alert('워터마크 이미지를 삭제했습니다.');
}


?>
