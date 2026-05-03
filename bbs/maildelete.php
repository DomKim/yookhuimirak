<?php
include_once('./_common.php');

// [권한 체크] 최고관리자('super') 또는 부관리자('admin02')만 실행 가능
if ($is_admin != 'super' && $member['mb_id'] != 'admin02') {
    die(json_encode(array('error' => '권한이 없습니다.')));
}

$wr_id = (int)$_POST['wr_id'];

if ($wr_id) {
    // DB 데이터 삭제
    sql_query(" delete from g5_email_data where id = '{$wr_id}' ");
}
?>