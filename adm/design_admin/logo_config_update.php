<?php
$sub_menu = "600100";
include_once('./_common.php');

check_demo();

auth_check($auth[$sub_menu], 'w');

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');


check_admin_token();

// 폳더생성
$common_dir = G5_DATA_PATH."/common";
if(!is_dir($common_dir)){
  mkdir($common_dir);
}

// 로고파일 업로드

$dest_path = G5_DATA_PATH."/common/";

if ($_FILES['logo_img']['name']){
  @move_uploaded_file($_FILES['logo_img']['tmp_name'], $dest_path.'logo_img');
}

if ($_FILES['logo_img2']['name']){
  @move_uploaded_file($_FILES['logo_img2']['tmp_name'], $dest_path.'logo_img2');
}

if ($_FILES['logo_img3']['name']){
  @move_uploaded_file($_FILES['logo_img3']['tmp_name'], $dest_path.'logo_img3');
}

// 로고 파일 삭제
if ($_POST['logo_img_del']){  @unlink(G5_DATA_PATH."/common/logo_img"); }
if ($_POST['logo_img_del2']){  @unlink(G5_DATA_PATH."/common/logo_img2"); }
if ($_POST['logo_img_del3']){  @unlink(G5_DATA_PATH."/common/logo_img3"); }


goto_url('./logo_config.php', false);
?>
