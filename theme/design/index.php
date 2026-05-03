<?php
define('_INDEX_', true);
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

if (G5_IS_MOBILE) {
    include_once(G5_THEME_MOBILE_PATH.'/index.php');
    return;
}

if(G5_COMMUNITY_USE === false) {
    include_once(G5_THEME_SHOP_PATH.'/index.php');
    return;
}

include_once(G5_THEME_PATH.'/head.php');

$sql1 = " select * from g5_content_block_set where name = 'mainpage' ";
$result1 = sql_query($sql1);

for ($i5=0; $row1=sql_fetch_array($result1); $i5++) {
  $content_area .= $row1['content_area'];
  $sidebar_area .= $row1['sidebar_area'];
  $sidebar_position .= $row1['sidebar_position'];
  $sidebar_parent .= $row1['sidebar_parent'];
}

$content = explode('|',$content_area);
for($i6=1; $i6<count($content); $i6++){
  $item_sql = " select * from g5_content_block where id = ".$content[$i6];
  $item_result = sql_fetch($item_sql);
  echo '<div class="clear-both">';
  include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
  echo '</div>';
}

include_once(G5_THEME_PATH.'/tail.php');
?>
