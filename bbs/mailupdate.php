<?php
include_once('./_common.php');

// [권한 체크] 최고관리자('super') 또는 부관리자('admin02')만 실행 가능
if ($is_admin != 'super' && $member['mb_id'] != 'admin02') {
    die(json_encode(array('error' => '권한이 없습니다.')));
}

$id = (int)$_POST['id'];
$manager = $_POST['manager']; // 담당자 배정 내용
$content = $_POST['content']; // 문의 내용 수정

if ($id) {
    // DB 업데이트
    $sql = " update g5_email_data 
             set wr_6 = '{$wr_6}', 
                 wr_3 = '{$wr_3}' 
             where id = '{$id}' ";
    sql_query($sql);
}
?>