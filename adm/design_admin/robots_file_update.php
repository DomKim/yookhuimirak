<?php
$sub_menu = "700050";
include_once('./_common.php');

check_demo();

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');

check_admin_token();

$common_dir = G5_PATH; // 경로지정

//////////////////////////////////////////////////////////////////
// robots 파일 생성.
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "파일생성") {

  $file = fopen($common_dir."/robots.txt","w");
  fwrite($file, 'User-agent:*
Disallow: /');
  fclose($file);

  alert('robots.txt 파일을 생성했습니다.');
}

//////////////////////////////////////////////////////////////////
// robots 파일 삭제.
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "파일삭제") {
  @unlink($common_dir.'/robots.txt');
  alert('robots.txt 파일을 삭제했습니다.');
}

//////////////////////////////////////////////////////////////////
// robots 파일의 내용 설정.
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "설정") {
  $robots_txt = $_POST['robots_txt'];

  $file = fopen($common_dir."/robots.txt","w");
  fwrite($file, $robots_txt);
  fclose($file);

  alert('robots.txt 설정 했습니다.');
}
?>
