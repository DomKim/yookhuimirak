<?php
$sub_menu = "700000";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "페이지작업중";
include_once(G5_ADMIN_PATH.'/admin.head.php');

?>

페이지 작업중 입니다.

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
