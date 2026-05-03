<?php
$sub_menu = "700010";
include_once('./_common.php');

if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');

//////////////////////////////////////////////////////////////////
// 메뉴생성
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == '생성') {

  //DB 업데이트
  $sql = " insert into g5_admin_menu (name)
                values ('".$file_name."')";

  sql_query($sql);

  alert('메뉴가 생성되었습니다.');

}


//////////////////////////////////////////////////////////////////
// 수정
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == '수정') {

  $modify_menu = $_POST['modify_menu'];
  $origin_menu = $_POST['origin_menu'];

  for($i=0;$i<count($modify_menu);$i++){
    $sql = " update g5_admin_menu set name = '".$modify_menu[$i]."' where name = '".$origin_menu[$i]."' ";
    sql_query($sql);
  }

  alert('메뉴가 수정되었습니다.');

}



//////////////////////////////////////////////////////////////////
// 서브메뉴 추간
//////////////////////////////////////////////////////////////////
if ($_POST['act_button'] == '추가') {

  $menu_id = $_POST['menu_id'];
  $board_id = $_POST['board_id'];
  $board_skin = $_POST['board_skin'];

  $board_sql = " select * from g5_board where bo_table = '".$board_id."' ";
  $board_result = sql_fetch($board_sql);

  //DB 업데이트
  $sql = " insert into g5_admin_menu (name,sub_id,board_id,board_skin)
                values ('".$board_result['bo_subject']."','".$menu_id."','".$board_id."','".$board_skin."')";

  sql_query($sql);


  alert('메뉴가 생성되었습니다.');

}



//////////////////////////////////////////////////////////////////
// 삭제
//////////////////////////////////////////////////////////////////
if($_GET['mode'] == 'menudel'){

  $id = $_GET['menu_id'];

  $sql = " delete from g5_admin_menu where id = '".$id."' ";
  sql_query($sql);

  alert('삭제되었습니다.');

}



//////////////////////////////////////////////////////////////////
// 서브메뉴 삭제
//////////////////////////////////////////////////////////////////
if($_GET['mode'] == 'del'){

  $sub_id = $_GET['sub_id'];
  $sql = " delete from g5_admin_menu where id = '".$sub_id."' ";
  sql_query($sql);

  alert('삭제되었습니다.');
}






// 업데이트 완료후 페이지 이동
goto_url('./admin_menu_set.php', false);
?>
