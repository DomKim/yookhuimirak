<?php
$sub_menu = "600200";
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
  $common_dir = G5_THEME_PATH."/template/";
  if(!is_dir($common_dir)){
    mkdir($common_dir);
  }

  if($_FILES['file_upload']['name']){

    for ($k=0; $k<count($_FILES['file_upload']['name']); $k++) {

      // zip파일 업로드
      $dest_path = G5_THEME_PATH."/template/".$_FILES['file_upload']['name'][$k];
      @move_uploaded_file($_FILES['file_upload']['tmp_name'][$k], $dest_path);

      // 파일이름
      $file_name_arr = explode('.',$_FILES['file_upload']['name'][$k]);
      $file_name = $file_name_arr[0];
      // 폴더 색성
      $common_dir = G5_THEME_PATH."/template/".$file_name;
      if(!is_dir($common_dir)){
        mkdir($common_dir);
        mkdir($common_dir.'/images');
      }
      // 압축풀 경로지정
      $zip_dir = G5_THEME_PATH."/template/".$file_name;
      // 압축해제
      $zip = new ZipArchive;
      $zip->open(G5_THEME_PATH.'/template/'.$_FILES['file_upload']['name'][$k]);
      $zip->extractTo($zip_dir);
      $zip->close();
      // 업로드된 zip 파일 삭제
      @unlink(G5_THEME_PATH."/template/".$_FILES['file_upload']['name'][$k]);

      //DB 업데이트
      $sql = " insert into g5_content_block
                    set block_name = '".$file_name."' ";

      sql_query($sql);

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
  $common_dir = G5_THEME_PATH."/template/"; // 경로

  $file_dir = G5_THEME_PATH."/template/".$_GET['file_name']; // 경로
  $img_dir = G5_THEME_PATH."/template/".$_GET['file_name']."/images"; // 이미지 경로
  $screenshot_img = $file_dir."/screenshot.png";

  $zip = new DirectZip();
  $zip->open($file_name);
  $zip->addFile($file_dir.'/index.html','index.html');
  $zip->addFile($file_dir.'/style.css','style.css');
  $zip->addFile($file_dir.'/script.js','script.js');
  $zip->addFile($file_dir.'/form_data.php','form_data.php');

  if (file_exists($screenshot_img)){
    $zip->addFile($file_dir.'/screenshot.png','screenshot.png');
  }

  if(is_dir($img_dir)) {
      if($dh = opendir($img_dir)) {
          while(($entry = readdir($dh)) !== false) {
              if($entry == '.' || $entry == '..')
                  continue;
              $subdir = $img_dir.'/'.$entry;
              if(is_dir($subdir)) {
                  //recursive_file_list($subdir);
              } else {
                $zip->addFile($file_dir.'/images/'.$entry,'images/'.$entry);
              }
          }
          closedir($dh);
      }
  }

  $zip->close();
  exit;
}




//////////////////////////////////////////////////////////////////
// 블럭생성
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "생성") {

  if ($is_admin != 'super')
      alert('최고관리자만 접근 가능합니다.');
  auth_check($auth[$sub_menu], 'w');


  check_admin_token();

  // 초기폳더생성
  $common_dir = G5_THEME_PATH."/template/";
  if(!is_dir($common_dir)){
    mkdir($common_dir);
  }

  if($_POST['file_name']){
  /* ==  파일 업로드 == */
  // 블럭파일 폴더 생성
  $common_dir2 = G5_THEME_PATH."/template/".$_POST['file_name']."/";
  if(!is_dir($common_dir2)){
    mkdir($common_dir2);
  }
  $common_dir3 = G5_THEME_PATH."/template/".$_POST['file_name']."/images/";
  if(!is_dir($common_dir3)){
    mkdir($common_dir3);
  }

  // html 파일 생성
  $file1 = fopen($common_dir2."index.html","w");
  fwrite($file1, '<?php
add_stylesheet("<link rel=\'stylesheet\' href=\'".G5_THEME_URL."/template/'.$_POST['file_name'].'/style.css\'>", 0);
?>
<!-- 내용시작 -->
<div class="'.$_POST['file_name'].'">

</div>
<!-- 내용끝 -->

<script src="<?=G5_THEME_URL?>/template/'.$_POST['file_name'].'/script.js" ></script>
  ');
  fclose($file1);

  // css 파일 생성
  $file2 = fopen($common_dir2."style.css","w");
  fwrite($file2, '/* 모든 스타일은 css 충돌방지를 위해 .'.$_POST['file_name'].'을 기준으로 작성 하시면 됩니다. 예) .'.$_POST['file_name'].' .box {} */
  .'.$_POST['file_name'].'{}
  ');
  fclose($file2);

  // js 파일 생성
  $file3 = fopen($common_dir2."script.js","w");
  fwrite($file3, '/* '.$_POST['file_name'].'의 js 파일 입니다. */');
  fclose($file3);


  $sql = " insert into g5_content_block
                set block_name = '".$_POST['file_name']."' ";

  sql_query($sql);

  }else{
    alert('파일이름을 입력하세요.');
  }

}





//////////////////////////////////////////////////////////////////
// 블럭 삭제
//////////////////////////////////////////////////////////////////
if($_GET['w'] == 'd'){
  // 데이터 및 파일 삭제
  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'd');


  // DB삭제
  $sql = " delete from g5_content_block where id = '$_GET[id]' ";
  sql_query($sql);

  // 파일 삭제
  $del_dir = G5_THEME_PATH."/template/".$_GET['file_name']; // 삭제 대상 폴더

  @unlink($del_dir.'/index.html');
  @unlink($del_dir.'/style.css');
  @unlink($del_dir.'/script.js');
  @unlink($del_dir.'/screenshot.png');
  @unlink($del_dir.'/form_data.php');

  $handle = opendir($del_dir.'/images'); // 절대경로
  while ($file = readdir($handle)) {
          @unlink($del_dir.'/images/'.$file);
  }
  closedir($handle);

  @rmdir($del_dir.'/images');
  @rmdir($del_dir);

}




//////////////////////////////////////////////////////////////////
// 테마선택
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "선택") {

  // 기존 쿠키값 삭제
  unset($_COOKIE["edit_theme"]);

  // 쿠키값 셋팅
  setcookie('edit_theme',$_POST['theme'],time() + 86400 * 30);
}



//////////////////////////////////////////////////////////////////
// 최신게시물 설정
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "최신게시물 설정") {

  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'w');

  $block_name = $_POST['block_name'];
  $type = $_POST['type'];
  $table = $_POST['bo_table'];
  $skin_name = $_POST['skin_name'];
  $list_count = $_POST['list_count'];
  $char_count = $_POST['char_count'];

  $latest_query = 'update g5_content_block set
                    type = "'.$type.'",
                    bo_table = "'.$table.'",
                    skin_name = "'.$skin_name.'",
                    list_count = "'.$list_count.'",
                    char_count = "'.$char_count.'" where block_name = "'.$block_name.'" ';

  sql_query($latest_query);

}

//////////////////////////////////////////////////////////////////
// 최신게시물 삭제
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == "최신게시물 삭제") {

  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'w');

  $block_name = $_POST['block_name'];

  $latest_query = 'update g5_content_block set
                    type = "",bo_table = "",skin_name = "",list_count = "",char_count = ""
                    where block_name = "'.$block_name.'" ';

  sql_query($latest_query);

}


// 업데이트 완료후 페이지 이동
goto_url('./content_block.php', false);
?>
