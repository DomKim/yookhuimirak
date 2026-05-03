<?php
$sub_menu = "700400";
include_once('_common.php');

check_demo();

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');

check_admin_token();

$common_dir = G5_THEME_PATH.'/act'; // 경로지정
if(!is_dir($common_dir)){
  mkdir($common_dir);
}

//////////////////////////////////////////////////////////////////
// 파일 생성.
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "설정") {

  $chat_script = stripslashes($_POST[chat_script]);

  $file = fopen($common_dir."/chat_code.html","w");
  fwrite($file, "{$chat_script}");
  fclose($file);

  alert('채널 API 를 설정 했습니다.');
}


//////////////////////////////////////////////////////////////////
// 파일 삭제.
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "사용안함") {

  @unlink($common_dir.'/chat_code.html');
  alert('설정파일을 삭제했습니다.');
}
?>
