<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$content_skin_url.'/style.css">', 0);

$sql1 = " select * from g5_content_block_set where name = '".$co_id."' ";
$result1 = sql_query($sql1);

for ($i=0; $row1=sql_fetch_array($result1); $i++) {
  $head_area .= $row1['head_area']; // 헤드영역
  $footer_area .= $row1['footer_area']; // 하단영역
  $left_sidebar_area .= $row1['left_sidebar_area']; // 왼쪽사이드 영역
  $b_left_sidebar_area .= $row1['b_left_sidebar_area']; // 큰 왼쪽 사이드 영역
  $sidebar_position .= $row1['sidebar_position']; // 사이드바 위치정보
}

// 사이드바 위치정보 배열
$position_arr = explode('|',$sidebar_position);
for ($i=1; $i < count($position_arr); $i++) {
  $position1 = $position_arr[1]; // left
  $position2 = $position_arr[2]; // right
  $position3 = $position_arr[3]; // b_left
  $position4 = $position_arr[4]; // b_right
}

// 헤드영억 파일 불러오기
$head = explode('|',$head_area);
for($i=1; $i<count($head); $i++){
  $item_sql = " select * from g5_content_block where id = ".$head[$i];
  $item_result = sql_fetch($item_sql);
  include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
}

?>
<style>
.ctt_admin {display: none;}
</style>

<div class="container">
<article id="ctt" class="ctt_<?php echo $co_id; ?>">
    <div id="ctt_con">
        <?php echo $str; ?>
    </div>
</article>
</div>

<?php
// 헤드영억 파일 불러오기
$footer = explode('|',$footer_area);
for($i=1; $i<count($footer); $i++){
  $item_sql = " select * from g5_content_block where id = ".$footer[$i];
  $item_result = sql_fetch($item_sql);
  include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
}
?>
