<?php
$sub_menu = "700900";
include_once('_common.php');
include_once(G5_ADMIN_PATH.'/design_admin/lib/dirzip.php');

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
auth_check($auth[$sub_menu], 'w');

check_demo();

if($_FILES['file_upload']['name']){
  $dest_path = '../../'.$_FILES['file_upload']['name'];
  //$dest_path = G5_THEME_PATH."/template/".$_FILES['file_upload']['name'];
  @move_uploaded_file($_FILES['file_upload']['tmp_name'], $dest_path);


  // 압축해제
  $zip_dir = "../../";
  $zip = new ZipArchive;
  $zip->open("../../".$_FILES['file_upload']['name']);
  $zip->extractTo($zip_dir);
  $zip->close();

  // 업로드된 zip 파일 삭제
  @unlink("../../".$_FILES['file_upload']['name']);

  $original = "../../gnuadmin-master";
  $copy = "../../";
  fileCopy($original.'/www',$copy);
  // 삭제
  rmdir_ok($original);


  alert('업데이트파일을 업로드 했습니다.');
}else{
  alert('업로드할 파일이 없습니다.');
}

goto_url('./update_result.php', false);
?>
