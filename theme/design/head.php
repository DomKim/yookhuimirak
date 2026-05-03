<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

if (G5_IS_MOBILE) {
    include_once(G5_THEME_MOBILE_PATH.'/head.php');
    return;
}

if(G5_COMMUNITY_USE === false) {
    include_once(G5_THEME_SHOP_PATH.'/shop.head.php');
    return;
}
include_once(G5_THEME_PATH.'/head.sub.php');
include_once(G5_LIB_PATH.'/latest.lib.php');
include_once(G5_LIB_PATH.'/outlogin.lib.php');
include_once(G5_LIB_PATH.'/poll.lib.php');
include_once(G5_LIB_PATH.'/visit.lib.php');
include_once(G5_LIB_PATH.'/connect.lib.php');
include_once(G5_LIB_PATH.'/popular.lib.php');


if(defined('_INDEX_')) { // index에서만 실행
    include G5_BBS_PATH.'/newwin.inc.php'; // 팝업레이어
}

// url 경로확인
$request_uri = $_SERVER['REQUEST_URI'];
$uri_arr = explode('/',$request_uri);
$uri1 = $uri_arr[1];
$uri2 = $uri_arr[2];

$sql1 = " select * from g5_content_block_set where name = 'mainpage' ";
$result1 = sql_query($sql1);

for ($i=0; $row1=sql_fetch_array($result1); $i++) {
  $head_area .= $row1['head_area']; // 헤드영역
  $left_sidebar_area .= $row1['left_sidebar_area']; // 왼쪽사이드 영역
  $b_left_sidebar_area .= $row1['b_left_sidebar_area']; // 큰 왼쪽 사이드 영역
  $sidebar_position .= $row1['sidebar_position']; // 사이드바 위치정보
}
// 사이드바 위치정보 배열
$position_arr = explode('|',$sidebar_position);
for ($i1=1; $i1 < count($position_arr); $i1++) {
  $position1 = $position_arr[1]; // left
  $position2 = $position_arr[2]; // right
  $position3 = $position_arr[3]; // b_left
  $position4 = $position_arr[4]; // b_right
}
// 기본 레이아웃 스타일
include_once(G5_THEME_PATH.'/basic_css.php');


if($position3 == 'b_left'){
  echo '<div id="b_left">';
  // 큰 왼쪽영역 파일 불러오기
  $b_left_sidebar = explode('|',$b_left_sidebar_area);
  for($i2=1; $i2<count($b_left_sidebar); $i2++){
    $item_sql = " select * from g5_content_block where id = ".$b_left_sidebar[$i2];
    $item_result = sql_fetch($item_sql);
    include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
  }
  echo '</div>';
}


// page_wrap start
echo '<div id="page_wrap">';
// 헤드영억 파일 불러오기
$head = explode('|',$head_area);
for($i3=1; $i3<count($head); $i3++){
  $item_sql = " select * from g5_content_block where id = ".$head[$i3];
  $item_result = sql_fetch($item_sql);
  include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
}



// content_wrap start
echo '<div id="content_wrap">';

if(!$co_id){
  if($uri1 == 'bbs'){
    echo '<div class="container">';
  }
}

if (!defined('_INDEX_')) {
  if(!$co_id){
    if($uri1 == 'bbs'){
      if($position1 == 'left'){
        echo '<div id="left">';
        // 왼쪽영역 파일 불러오기
        $left_sidebar = explode('|',$left_sidebar_area);
        for($i4=1; $i4<count($left_sidebar); $i4++){
          $item_sql = " select * from g5_content_block where id = ".$left_sidebar[$i4];
          $item_result = sql_fetch($item_sql);
          include_once(G5_THEME_PATH.'/template/'.$item_result['block_name'].'/index.html');
        }
        echo '</div>';
      }

      echo '<div class="container_content">';
    }
  }
}
?>
