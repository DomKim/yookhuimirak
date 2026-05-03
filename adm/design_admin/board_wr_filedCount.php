<?php
// 여분필드 갯수 알아내기.
$extend_column = "SELECT count(*) cnt FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME LIKE '%wr_%' AND TABLE_NAME = 'g5_write_".$form_filed[board]."'
AND COLUMN_NAME
NOT IN ('wr_id','wr_num','wr_reply','wr_parent','wr_is_comment','wr_comment','wr_comment_reply','ca_name','wr_option','wr_subject','wr_content','wr_link1','wr_link2','wr_link1_hit','wr_link2_hit','wr_hit','wr_good','wr_nogood','mb_id','wr_password','wr_name','wr_email','wr_homepage','wr_datetime','wr_file','wr_last','wr_ip','wr_facebook_user','wr_twitter_user')";
$cnt = sql_fetch($extend_column);
$filedCount = $cnt['cnt'];


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
