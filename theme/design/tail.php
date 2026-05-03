<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

if (G5_IS_MOBILE) {
    include_once(G5_THEME_MOBILE_PATH.'/tail.php');
    return;
}

if(G5_COMMUNITY_USE === false) {
    include_once(G5_THEME_SHOP_PATH.'/shop.tail.php');
    return;
}

$sql1 = " select * from g5_content_block_set where name = 'mainpage' ";
$result1 = sql_query($sql1);

for ($i7=0; $row1=sql_fetch_array($result1); $i7++) {
  $footer_area .= $row1['footer_area']; // 푸터영역
  $right_sidebar_area .= $row1['right_sidebar_area']; // 오른쪽사이드 영역
  $b_right_sidebar_area .= $row1['b_right_sidebar_area']; // 큰 오른쪽 사이드 영역
  $sidebar_position .= $row1['sidebar_position']; // 사이드바 위치정보
}

// 사이드바 위치정보 배열
$position_arr = explode('|',$sidebar_position);
for ($i8=1; $i8 < count($position_arr); $i8++) {
  $position1 = $position_arr[1]; // left
  $position2 = $position_arr[2]; // right
  $position3 = $position_arr[3]; // b_left
  $position4 = $position_arr[4]; // b_right
}


if (!defined('_INDEX_')) {
  if(!$co_id){
    if($uri1 == 'bbs'){
    echo '</div>';


    if($position2 == 'right'){
      echo '<div id="right">';
      // 오른쪽영억 파일 불러오기
      $right_sidebar = explode('|',$right_sidebar_area);
      for($i9=1; $i9<count($right_sidebar); $i9++){
        $item_sql = " select * from g5_content_block where id = ".$right_sidebar[$i9];
        $item_result = sql_fetch($item_sql);
        include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
      }
      echo '</div>';
    }

    }
  }
}

if(!$co_id){
  if($uri1 == 'bbs'){
    echo '</div>';
  }
}
echo '</div>';
// content_wrap end



echo '<div id="footer">';
// 하단영역 파일 불러오기
$footer = explode('|',$footer_area);
for($i10=1; $i10<count($footer); $i10++){
  $item_sql = " select * from g5_content_block where id = ".$footer[$i10];
  $item_result = sql_fetch($item_sql);
  include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
}
echo '</div>';

echo '</div>';
// page_wrap end





if($position4 == 'b_right'){
  echo '<div id="b_right">';
  // 큰 오른쪽영억 파일 불러오기
  $b_right_sidebar = explode('|',$b_right_sidebar_area);
  for($i11=1; $i11<count($b_right_sidebar); $i11++){
    $item_sql = " select * from g5_content_block where id = ".$b_right_sidebar[$i11];
    $item_result = sql_fetch($item_sql);
    include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
  }
  echo '</div>';
}




if(G5_DEVICE_BUTTON_DISPLAY && !G5_IS_MOBILE) { ?>
<?php
}

if ($config['cf_analytics']) {
    echo $config['cf_analytics'];
}
?>

<!-- } 하단 끝 -->

<!-- 하단 스크립트 -->
<?php
$sql1 = " select * from g5_block_setup where setup_2 = 'js' and setup_1 = 'y' ";
$result1 = sql_query($sql1);

for ($i12=0; $row1=sql_fetch_array($result1); $i12++) {
?>
<script type="text/javascript" src="<?=G5_THEME_URL.'/js/'.$row1['name']?>.js"></script>
<?
}


$sql2 = " select * from g5_block_setup_meta where name = 'mainpage' ";
$result2 = sql_fetch($sql2);
?>
<script>
<?=$result2['setup_1']?>
</script>

<script>
$(function() {
    // 폰트 리사이즈 쿠키있으면 실행
    font_resize("container", get_cookie("ck_font_resize_rmv_class"), get_cookie("ck_font_resize_add_class"));
});
</script>

<?php
// chat_code include
$chatFile = $fp = fopen(G5_THEME_PATH.'/act/chat_code.html', 'r');
if($chatFile){
  include_once(G5_THEME_PATH."/act/chat_code.html");
}

include_once(G5_THEME_PATH."/tail.sub.php");
?>
