<?php
$sub_menu = "600250";
include_once('./_common.php');
include_once(G5_ADMIN_PATH.'/design_admin/lib/direct_zip.php');

check_demo();

//////////////////////////////////////////////////////////////////
// 파일 업로드
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "파일업로드") {
  if ($is_admin != 'super')
      alert('최고관리자만 접근 가능합니다.');
  auth_check($auth[$sub_menu], 'w');

  check_admin_token();

  // 초기폴더 생성
  $common_dir = G5_THEME_PATH."/skin/latest/";
  if(!is_dir($common_dir)){
    mkdir($common_dir);
  }

  if($_FILES['file_upload']['name']){

    for ($k=0; $k<count($_FILES['file_upload']['name']); $k++) {

      // zip파일 업로드
      $dest_path = G5_THEME_PATH."/skin/latest/".$_FILES['file_upload']['name'][$k];
      @move_uploaded_file($_FILES['file_upload']['tmp_name'][$k], $dest_path);

      // 파일이름
      $file_name_arr = explode('.',$_FILES['file_upload']['name'][$k]);
      $file_name = $file_name_arr[0];
      // 폴더 색성
      $common_dir = G5_THEME_PATH."/skin/latest/".$file_name;
      if(!is_dir($common_dir)){
        mkdir($common_dir);
        mkdir($common_dir.'/img');
      }
      // 압축풀 경로지정
      $zip_dir = G5_THEME_PATH."/skin/latest/".$file_name;
      // 압축해제
      $zip = new ZipArchive;
      $zip->open(G5_THEME_PATH.'/skin/latest/'.$_FILES['file_upload']['name'][$k]);
      $zip->extractTo($zip_dir);
      $zip->close();
      // 업로드된 zip 파일 삭제
      @unlink(G5_THEME_PATH."/skin/latest/".$_FILES['file_upload']['name'][$k]);
    }


    alert('파일업로드가 정상적으로 이루어졌습니다.');

  }else{

    alert('업로드할 파일이 없습니다.');
  }

}



//////////////////////////////////////////////////////////////////
// 파일 다운로드
//////////////////////////////////////////////////////////////////
if($_GET['w'] == 'download'){
  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'w');

  // 해당 폴더 압축
  $file_name = $_GET['file_name'].'.zip'; // 파일이름
  $common_dir = G5_THEME_PATH."/skin/latest/"; // 경로

  $file_dir = G5_THEME_PATH."/skin/latest/".$_GET['file_name']; // 경로
  $img_dir = G5_THEME_PATH."/skin/latest/".$_GET['file_name']."/img"; // 이미지 경로
  //$screenshot_img = $file_dir."/screenshot.png";

  $zip = new DirectZip();
  $zip->open($file_name);
  $zip->addFile($file_dir.'/latest.skin.php','latest.skin.php');
  $zip->addFile($file_dir.'/style.css','style.css');

  if(is_dir($img_dir)) {
      if($dh = opendir($img_dir)) {
          while(($entry = readdir($dh)) !== false) {
              if($entry == '.' || $entry == '..')
                  continue;
              $subdir = $img_dir.'/'.$entry;
              if(is_dir($subdir)) {
                  //recursive_file_list($subdir);
              } else {
                $zip->addFile($file_dir.'/img/'.$entry,'img/'.$entry);
              }
          }
          closedir($dh);
      }
  }

  $zip->close();
  exit;
}




//////////////////////////////////////////////////////////////////
// 최근게시물스킨 생성
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "생성") {

  if ($is_admin != 'super')
      alert('최고관리자만 접근 가능합니다.');
  auth_check($auth[$sub_menu], 'w');


  check_admin_token();

  if($_POST[file_name]){
  /* ==  파일 업로드 == */
  // 블럭파일 폴더 생성
  $common_dir2 = G5_THEME_PATH."/skin/latest/".$_POST[file_name]."/";
  if(!is_dir($common_dir2)){
    mkdir($common_dir2);
  }
  $common_dir3 = G5_THEME_PATH."/skin/latest/".$_POST[file_name]."/img/";
  if(!is_dir($common_dir3)){
    mkdir($common_dir3);
  }

  // php 파일 생성
  $file1 = fopen($common_dir2."latest.skin.php","w");
  fwrite($file1, '<?php
if (!defined(\'_GNUBOARD_\')) exit; // 개별 페이지 접근 불가

// add_stylesheet(\'css 구문\', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet(\'<link rel="stylesheet" href="\'.$latest_skin_url.\'/style.css">\', 0);
?>
  ');
  fclose($file1);

  // css 파일 생성
  $file2 = fopen($common_dir2."style.css","w");
  fwrite($file2, '@charset "utf-8";
/* 새글 스킨 (latest) */'.$_POST[file_name].'{}
  ');
  fclose($file2);


  }else{
    alert('파일이름을 입력하세요.');
  }

}





//////////////////////////////////////////////////////////////////
// 최근게시물스킨 삭제
//////////////////////////////////////////////////////////////////
if($_GET['w'] == 'd'){
  // 데이터 및 파일 삭제
  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'd');



  // 파일 삭제
  $del_dir = G5_THEME_PATH."/skin/latest/".$_GET['file_name']; // 삭제 대상 폴더

  //alert($del_dir);

  @unlink($del_dir.'/latest.skin.php');
  @unlink($del_dir.'/style.css');

  $handle = opendir($del_dir.'/img'); // 절대경로
  while ($file = readdir($handle)) {
          @unlink($del_dir.'/img/'.$file);
  }
  closedir($handle);

  @rmdir($del_dir.'/img');
  @rmdir($del_dir);

}



// 업데이트 완료후 페이지 이동
goto_url('./latest_skin.php', false);
?>
