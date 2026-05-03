<?php
$sub_menu = "600300";
include_once('./_common.php');



//////////////////////////////////////////////////////////////////
// 기본CSS 파일 업데이트
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == 'CSS 파일업로드') {

  auth_check($auth[$sub_menu], 'w');
  check_admin_token();

  if($_FILES['file_upload1']['name']){

  // 폴더 색성
  $common_dir = G5_THEME_PATH."/css";
  if(!is_dir($common_dir)){
    mkdir($common_dir);
  }

  $dest_path = G5_THEME_PATH."/css/".$_FILES['file_upload1']['name'];
  @move_uploaded_file($_FILES['file_upload1']['tmp_name'], $dest_path);


  // 파일이름
  $file_name_arr = explode('.css',$_FILES['file_upload1']['name']);
  $file_name = $file_name_arr[0];


  //DB 업데이트
  $sql = " insert into g5_block_setup (name, setup_2)
                values ('".$file_name."', 'css')";

  sql_query($sql);

    alert('파일업로드가 정상적으로 이루어졌습니다.');
  }else{
    alert('업로드할 파일이 없습니다.');
  }

}



//////////////////////////////////////////////////////////////////
// 기본CSS 파일 삭제
//////////////////////////////////////////////////////////////////
if($_GET['w'] == 'd' && $_GET['part'] == 'css' ){
  // 데이터 및 파일 삭제
  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'd');


  // DB삭제
  $sql = "delete from g5_block_setup where name = '".$_GET['name']."' and setup_2 = 'css' ";
  sql_query($sql);

  // 업로드된 파일 삭제
  @unlink(G5_THEME_PATH."/css/".$_GET[name].".css");
  alert('파일을 삭제 했습니다.');
}



//////////////////////////////////////////////////////////////////
// 기본JS 파일 업데이트
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == 'JS 파일업로드') {

  auth_check($auth[$sub_menu], 'w');
  check_admin_token();

  if($_FILES['file_upload2']['name']){

  // 폴더 색성
  $common_dir = G5_THEME_PATH."/js";
  if(!is_dir($common_dir)){
    mkdir($common_dir);
  }

  $dest_path = G5_THEME_PATH."/js/".$_FILES['file_upload2']['name'];
  @move_uploaded_file($_FILES['file_upload2']['tmp_name'], $dest_path);


  // 파일이름
  $file_name_arr = explode('.js',$_FILES['file_upload2']['name']);
  $file_name = $file_name_arr[0];


  //DB 업데이트
  $sql = " insert into g5_block_setup (name, setup_2)
                values ('".$file_name."', 'js')";

  sql_query($sql);

    alert('파일업로드가 정상적으로 이루어졌습니다.');
  }else{
    alert('업로드할 파일이 없습니다.');
  }


}



//////////////////////////////////////////////////////////////////
// 기본JS 파일 삭제
//////////////////////////////////////////////////////////////////
if($_GET['w'] == 'd' && $_GET['part'] == 'js' ){
  // 데이터 및 파일 삭제
  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'd');


  // DB삭제
  $sql = "delete from g5_block_setup where name = '".$_GET['name']."' and setup_2 = 'js' ";
  sql_query($sql);

  // 업로드된 파일 삭제
  @unlink(G5_THEME_PATH."/js/".$_GET[name].".js");
  alert('파일을 삭제 했습니다.');
}




// 사용여부/메타태그 추가 업데이트
if ($_POST['act_button'] == "확인") {

  if ($is_admin != 'super')
      alert('게시판 삭제는 최고관리자만 가능합니다.');

  auth_check($auth[$sub_menu], 'u');

  for($i=0; $i < count($_POST['checked']); $i++){
    $checked_arr .= $_POST['checked'][$i];
  }

  $checkA = explode(',',$checked_arr);

  for($j=0; $j<count($_POST['checked_name']); $j++){

    if($checkA[$j]){
      $sql = "update g5_block_setup set setup_1 = 'y' where name = '".$_POST['checked_name'][$j]."' and setup_2 = '".$_POST['checked_ex'][$j]."' ";
    }else{
      $sql = "update g5_block_setup set setup_1 = '' where name = '".$_POST['checked_name'][$j]."' and setup_2 = '".$_POST['checked_ex'][$j]."' ";
    }

    sql_query($sql);
  }

  // 매타태그 변수저장
  $metaAdd = $_POST['metaAdd'];
  $sql1 = "update g5_block_setup_meta set setup_1 = '".$metaAdd."' where name = 'mainpage' ";
  sql_query($sql1);

}

// 업데이트 완료후 페이지 이동
goto_url('./block_setup.php', false);
?>
