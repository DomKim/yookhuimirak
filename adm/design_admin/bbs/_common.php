<?php
define('G5_IS_ADMIN', true);
include_once ('../../../common.php');
include_once(G5_ADMIN_PATH.'/admin.lib.php');
include_once(G5_ADMIN_PATH.'/admin_lib/admin.lib.php');

/* 디바이스체크 */
//require_once (G5_PATH.'/Mobile_Detect/Mobile_Detect.php'); // 모바일 Detect Class 파일
//$detect = new Mobile_Detect;
//$deviceType = ($detect->isMobile() ? ($detect->isTablet() ? 'tablet' : 'phone') : 'computer');

// 색상지정
$theme_color = "#3488f7";
$theme_color_bar = "#3488f7";

// db정보
$admin_sql = " select * from g5_admin_menu where board_id = '".$bo_table."' ";
$admin_result = sql_query($admin_sql);

for ($i=0; $admin_menu_row=sql_fetch_array($admin_result); $i++) {
  $admin_menu_subid .= $admin_menu_row['sub_id'];
  $admin_menu_id .= $admin_menu_row['id'];
  $admin_menu_skin .= $admin_menu_row['board_skin'];
}

$admin_sub_menu = $admin_menu_subid;
$admin_sub_menu_id = $admin_menu_id;
$board_skin_path = G5_THEME_PATH.'/skin/board/'.$admin_menu_skin;
$board_skin_url = G5_THEME_URL.'/skin/board/'.$admin_menu_skin;

?>
