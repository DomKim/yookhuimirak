<?php
$sub_menu = "600260";
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
  $common_dir = G5_THEME_PATH."/skin/board/";
  if(!is_dir($common_dir)){
    mkdir($common_dir);
  }

  if($_FILES['file_upload']['name']){

    for ($k=0; $k<count($_FILES['file_upload']['name']); $k++) {

      // zip파일 업로드
      $dest_path = G5_THEME_PATH."/skin/board/".$_FILES['file_upload']['name'][$k];
      @move_uploaded_file($_FILES['file_upload']['tmp_name'][$k], $dest_path);

      // 파일이름
      $file_name_arr = explode('.',$_FILES['file_upload']['name'][$k]);
      $file_name = $file_name_arr[0];
      // 폴더 색성
      $common_dir = G5_THEME_PATH."/skin/board/".$file_name;
      if(!is_dir($common_dir)){
        mkdir($common_dir);
        mkdir($common_dir.'/img');
      }
      // 압축풀 경로지정
      $zip_dir = G5_THEME_PATH."/skin/board/".$file_name;
      // 압축해제
      $zip = new ZipArchive;
      $zip->open(G5_THEME_PATH.'/skin/board/'.$_FILES['file_upload']['name'][$k]);
      $zip->extractTo($zip_dir);
      $zip->close();
      // 업로드된 zip 파일 삭제
      @unlink(G5_THEME_PATH."/skin/board/".$_FILES['file_upload']['name'][$k]);
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
  $common_dir = G5_THEME_PATH."/skin/board/"; // 경로

  $file_dir = G5_THEME_PATH."/skin/board/".$_GET['file_name']; // 경로
  $img_dir = G5_THEME_PATH."/skin/board/".$_GET['file_name']."/img"; // 이미지 경로
  //$screenshot_img = $file_dir."/screenshot.png";

  $zip = new DirectZip();
  $zip->open($file_name);
  $zip->addFile($file_dir.'/list.skin.php','list.skin.php');
  $zip->addFile($file_dir.'/view.skin.php','view.skin.php');
  $zip->addFile($file_dir.'/view_comment.skin.php','view_comment.skin.php');
  $zip->addFile($file_dir.'/write.skin.php','write.skin.php');
  $zip->addFile($file_dir.'/write_update.skin.php','write_update.skin.php');
  $zip->addFile($file_dir.'/write_comment_update.skin.php','write_comment_update.skin.php');

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
  $common_dir2 = G5_THEME_PATH."/skin/board/".$_POST[file_name]."/";
  if(!is_dir($common_dir2)){
    mkdir($common_dir2);
  }
  $common_dir3 = G5_THEME_PATH."/skin/board/".$_POST[file_name]."/img/";
  if(!is_dir($common_dir3)){
    mkdir($common_dir3);
  }
  // 베이직게시판 스킨을 가져오기.
  $origin_file_path = G5_THEME_PATH."/skin/board/basic/";


  // list 파일 생성
  $orgFile1 = $fp1 = fopen($origin_file_path.'/list.skin.php', 'r');
  if ($orgFile1) {
     $content_code1 = '';
     while ($line1 = fgets($fp1, 1024)) {
        $content_code1 .= $line1;
     }
  }
  $content_code_re1 = str_replace('</textarea>','</ textarea>',$content_code1);

  $file1 = fopen($common_dir2."list.skin.php","w");
  fwrite($file1, $content_code_re1);
  fclose($file1);


  // view.skin 파일 생성
  $orgFile2 = $fp2 = fopen($origin_file_path.'/view.skin.php', 'r');
  if ($orgFile2) {
     $content_code2 = '';
     while ($line2 = fgets($fp2, 1024)) {
        $content_code2 .= $line2;
     }
  }
  $content_code_re2 = str_replace('</textarea>','</ textarea>',$content_code2);

  $file2 = fopen($common_dir2."view.skin.php","w");
  fwrite($file2, $content_code_re2);
  fclose($file2);


  // view_comment.skin 파일 생성
  $orgFile3 = $fp3 = fopen($origin_file_path.'/view_comment.skin.php', 'r');
  if ($orgFile3) {
     $content_code3 = '';
     while ($line3 = fgets($fp3, 1024)) {
        $content_code3 .= $line3;
     }
  }
  $content_code_re3 = str_replace('</textarea>','</ textarea>',$content_code3);

  $file3 = fopen($common_dir2."view_comment.skin.php","w");
  fwrite($file3, $content_code_re3);
  fclose($file3);


  // write.skin 파일 생성
  $orgFile4 = $fp4 = fopen($origin_file_path.'/write.skin.php', 'r');
  if ($orgFile4) {
     $content_code4 = '';
     while ($line4 = fgets($fp4, 1024)) {
        $content_code4 .= $line4;
     }
  }
  $content_code_re4 = str_replace('</textarea>','</ textarea>',$content_code4);

  $file4 = fopen($common_dir2."write.skin.php","w");
  fwrite($file4, $content_code_re4);
  fclose($file4);


  // write_update.skin 파일 생성
  $orgFile5 = $fp5 = fopen($origin_file_path.'/write_update.skin.php', 'r');
  if ($orgFile5) {
     $content_code5 = '';
     while ($line5 = fgets($fp5, 1024)) {
        $content_code5 .= $line5;
     }
  }
  $content_code_re5 = str_replace('</textarea>','</ textarea>',$content_code5);

  $file5 = fopen($common_dir2."write_update.skin.php","w");
  fwrite($file5, $content_code_re5);
  fclose($file5);


  // write_comment_update.skin 파일 생성
  $orgFile6 = $fp6 = fopen($origin_file_path.'/write_comment_update.skin.php', 'r');
  if ($orgFile6) {
     $content_code6 = '';
     while ($line6 = fgets($fp6, 1024)) {
        $content_code6 .= $line6;
     }
  }
  $content_code_re6 = str_replace('</textarea>','</ textarea>',$content_code6);

  $file6 = fopen($common_dir2."write_comment_update.skin.php","w");
  fwrite($file6, $content_code_re6);
  fclose($file6);



  // css 파일 생성
  $orgFile6 = $fp6 = fopen($origin_file_path.'/style.css', 'r');
  if ($orgFile6) {
     $content_code6 = '';
     while ($line6 = fgets($fp6, 1024)) {
        $content_code6 .= $line6;
     }
  }
  $content_code_re6 = str_replace('</textarea>','</ textarea>',$content_code6);

  $file5 = fopen($common_dir2."style.css","w");
  fwrite($file5, $content_code_re6);
  fclose($file5);



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
  $del_dir = G5_THEME_PATH."/skin/board/".$_GET['file_name']; // 삭제 대상 폴더

  @unlink($del_dir.'/list.skin.php');
  @unlink($del_dir.'/view.skin.php');
  @unlink($del_dir.'/view_comment.skin.php');
  @unlink($del_dir.'/write.skin.php');
  @unlink($del_dir.'/write_update.skin.php');
  @unlink($del_dir.'/write_comment_update.skin.php');

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
goto_url('./board_skin.php', false);
?>
