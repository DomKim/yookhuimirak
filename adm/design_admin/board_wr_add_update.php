<?php
$sub_menu = "700200";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');


//////////////////////////////////////////////////////////////////
// 게시판 여분필드 추가
//////////////////////////////////////////////////////////////////
if ($_GET['send'] == 'update') {

  $bo_table = 'g5_write_'.$_GET['bo_table'];

  $extend_column = "SELECT count(*) cnt FROM INFORMATION_SCHEMA.COLUMNS
  WHERE COLUMN_NAME LIKE '%wr_%' AND TABLE_NAME = '".$bo_table."'
  AND COLUMN_NAME
  NOT IN ('wr_id','wr_num','wr_reply','wr_parent','wr_is_comment','wr_comment','wr_comment_reply','ca_name','wr_option','wr_subject','wr_content','wr_link1','wr_link2','wr_link1_hit','wr_link2_hit','wr_hit','wr_good','wr_nogood','mb_id','wr_password','wr_name','wr_email','wr_homepage','wr_datetime','wr_file','wr_last','wr_ip','wr_facebook_user','wr_twitter_user')";
  $cnt = sql_fetch($extend_column);
  $addWr_num = $cnt['cnt']+1;

  $wr_add_query = 'alter table '.$bo_table.' add wr_'.$addWr_num.' varchar(255) not null';
  sql_query($wr_add_query);

  alert('여분필드가 추가되었습니다.');
}

//////////////////////////////////////////////////////////////////
// 게시판 여분필드 삭제
//////////////////////////////////////////////////////////////////
if ($_GET['send'] == 'delete') {

  $bo_table = 'g5_write_'.$_GET['bo_table'];

  $extend_column = "SELECT count(*) cnt FROM INFORMATION_SCHEMA.COLUMNS
  WHERE COLUMN_NAME LIKE '%wr_%' AND TABLE_NAME = '".$bo_table."'
  AND COLUMN_NAME
  NOT IN ('wr_id','wr_num','wr_reply','wr_parent','wr_is_comment','wr_comment','wr_comment_reply','ca_name','wr_option','wr_subject','wr_content','wr_link1','wr_link2','wr_link1_hit','wr_link2_hit','wr_hit','wr_good','wr_nogood','mb_id','wr_password','wr_name','wr_email','wr_homepage','wr_datetime','wr_file','wr_last','wr_ip','wr_facebook_user','wr_twitter_user')";
  $cnt = sql_fetch($extend_column);
  $addWr_num = $cnt['cnt'];

  if($addWr_num <= 10){
    alert('10개 이하부터는 삭제되지 않습니다.');
  }else{
    $wr_add_query = 'alter table '.$bo_table.' drop wr_'.$addWr_num.'';
    sql_query($wr_add_query);
    alert('여분필드가 삭제되었습니다.');
  }
}

// 업데이트 완료후 페이지 이동
goto_url('./board_wr_add.php', false);
?>
