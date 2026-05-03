<?php
// 접수폼 연동 관련된 DB 가져오기.
$sql = " select * from g5_content_block where form_board = '{$bo_table}' ";
$filed = sql_fetch($sql);

$form_data_file = G5_THEME_PATH."/template/".$filed['block_name']."/form_data.php";
if (file_exists($form_data_file)){
  include_once($form_data_file);
}

// 전송할 게시판의 여분필드갯수와 연동. 게시판이 연동 되어있지 않을경우, 기본10개 표시.
if($form_filed['board']){
  $extend_column = "SELECT count(*) cnt FROM INFORMATION_SCHEMA.COLUMNS
  WHERE COLUMN_NAME LIKE '%wr_%' AND TABLE_NAME = 'g5_write_".$form_filed[board]."'
  AND COLUMN_NAME
  NOT IN ('wr_id','wr_num','wr_reply','wr_parent','wr_is_comment','wr_comment','wr_comment_reply','ca_name','wr_option','wr_subject','wr_content','wr_link1','wr_link2','wr_link1_hit','wr_link2_hit','wr_hit','wr_good','wr_nogood','mb_id','wr_password','wr_name','wr_email','wr_homepage','wr_datetime','wr_file','wr_last','wr_ip','wr_facebook_user','wr_twitter_user')";
  $cnt = sql_fetch($extend_column);
  $filedCount = $cnt['cnt'];
}else{
  $filedCount = 10;
}


for($i = 1; $i <= $filedCount; $i++){
  $filed_arr_[$i] = explode('|',$form_filed['wr_'.$i]);
  $filed_name_[$i] = $filed_arr_[$i][0];
  $filed_type_[$i] = $filed_arr_[$i][1];
  $filed_pl_[$i] = $filed_arr_[$i][2];
  $filed_default_[$i] = $filed_arr_[$i][3];
  $filed_required_[$i] = $filed_arr_[$i][4];
  $filed_admin_[$i] = $filed_arr_[$i][5];
}

$subject_filed_arr = explode('|',$form_filed['wr_subject']);
$wr_subject_name = $subject_filed_arr[0];
$wr_subject_pl = $subject_filed_arr[1];
$wr_subject_default = $subject_filed_arr[2];
$wr_subject_hidden = $subject_filed_arr[3];

$content_filed_arr = explode('|',$form_filed['wr_content']);
$wr_content_name = $content_filed_arr[0];
$wr_content_pl = $content_filed_arr[1];
$wr_content_default = $content_filed_arr[2];
$wr_content_hidden = $content_filed_arr[3];


?>
