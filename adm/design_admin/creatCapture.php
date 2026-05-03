<?php
include_once('./_common.php');

check_demo();

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
auth_check($auth[$sub_menu], 'w');

$mode = $_POST['mode']; // 생성인지, 삭제인지 변수.

// 미리보기페이지 에서의 썸네일 생성.
$name = $_POST['name'];

// 업로드 경로
$upload_dir = G5_THEME_PATH."/template/".$name."/";

// 데이터 생성
if($mode == 'write'){
  echo 'write';
  $img = $_POST['hidden_data']; // 데이터값
  $img = str_replace('data:image/png;base64,', '', $img);
  $img = str_replace(' ', '+', $img);
  $data = base64_decode($img);
  $file = $upload_dir."screenshot.png";

  // 캡처한 이미지데이터 저장.
  $success = file_put_contents($file, $data);
  print $success ? $file : 'Unable to save the file.';
}

// 썸네일 삭제
if($mode == 'del'){
  echo 'del';
  @unlink($upload_dir."/screenshot.png");
}

?>
