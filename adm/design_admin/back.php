<?php
$sub_menu = "600300";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "메인페이지 레이아웃 설정";
include_once(G5_ADMIN_PATH.'/admin.head.php');


add_stylesheet('<link rel="stylesheet" href="'.G5_ADMIN_URL.'/design_admin/css/block_setup.css">', -1);
add_javascript('<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>', 0);
add_javascript('<script src="'.G5_ADMIN_URL.'/design_admin/js/block_setup.js"></script>', 0);

$page_name = $_GET['name'];

$b_sidebar_left = $_GET['b_left'];
$b_sidebar_right = $_GET['b_right'];
$sidebar_left = $_GET['left'];
$sidebar_right = $_GET['right'];

// DB 가져오기
$sql1 = " select * from g5_content_block_set where name = '".$page_name."' ";
$result1 = sql_query($sql1);

for ($i=0; $row1=sql_fetch_array($result1); $i++) {
  $empty_area .= $row1['empty_area'];
  $head_area .= $row1['head_area'];
  $content_area .= $row1['content_area'];
  $footer_area .= $row1['footer_area'];
  $sidebar_area .= $row1['sidebar_area'];
  $sidebar_position .= $row1['sidebar_position'];
}
?>
<section>

<div>
  <h2 class="h2_frm">사이드바 사용</h2>
  <div class="tbl_frm01 tbl_wrap">
    <table>
      <tbody>

      <tr>
          <th scope="row">사이드바 위치설정</th>
          <td>
              <input type="checkbox" name="side_position" value="left">왼쪽
              <input type="checkbox" name="side_position" value="right">오른쪽
              <input type="checkbox" name="side_position" value="b_left">큰왼쪽
              <input type="checkbox" name="side_position" value="b_right">큰오른쪽
          </td>
      </tr>

      </tbody>
    </table>
  </div>
</div>

<div class="layout_wrap">
  <div class="left_list">
    <h2 class="h2_frm">컨텐츠 블럭리스트</h2>
    <div id="sortable1" class="droptrue">
      <?php
      // 블럭 리스트 전체를 뿌리고, 화면구성에서 셋팅된 아이템들은 빼고 리스트. (쿼리문에서 제어해야함)
        $head_arr = explode('|',$head_area);
        for ($f=1; $f < count($head_arr); $f++) {
          $whereQuery .= "'".$head_arr[$f]."',";
          $headQuery .= "'".$head_arr[$f]."',";
        }
        $content_arr = explode('|',$content_area);
        for ($f=1; $f < count($content_arr); $f++) {
          $whereQuery .= "'".$content_arr[$f]."',";
          $contentQuery .= "'".$content_arr[$f]."',";
        }
        $footer_arr = explode('|',$footer_area);
        for ($f=1; $f < count($footer_arr); $f++) {
          $whereQuery .= "'".$footer_arr[$f]."',";
          $footerQuery .= "'".$footer_arr[$f]."',";
        }
        $sidebar_arr = explode('|',$sidebar_area);
        for ($f=1; $f < count($sidebar_arr); $f++) {
          $whereQuery .= "'".$sidebar_arr[$f]."',";
          $sidebarQuery .= "'".$sidebar_arr[$f]."',";
        }

        $sql = " SELECT * FROM g5_content_block WHERE id NOT IN ({$whereQuery}'') ";

        $result = sql_query($sql);

        for ($i=0; $row=sql_fetch_array($result); $i++) {
          ?>
        <div class="item" id="<?=$row['id']?>">
          no.<?=$row['id'].' : '.$row['block_name']?>
        </div>
        <?php
        }

      ?>
    </div>
  </div>

  <div class="layout">
    <div class="layout_content">
      <h2 class="h2_frm">화면 구성</h2>
      <?php if($b_sidebar_left){?>
      <div class="b_side_left">
        <div id="b_side_left" class="droptrue">
        큰 왼쪽
        </div>
      </div>
      <?php }?>
      <?php
      if(!($b_sidebar_left && $b_sidebar_right)){ $content_wrap_width = 'style="width:100%"'; }
      ?>
      <div class="content_wrap" <?=$content_wrap_width?>>
        <div id="sortable2" class="droptrue">
          상단영역
          <?php
            $item_sql1 = " SELECT * FROM g5_content_block WHERE id IN ({$headQuery}'')";
            $item_result1 = sql_query($item_sql1);
            for ($i=0; $row1=sql_fetch_array($item_result1); $i++) {
            ?>
            <div class="item" id="<?=$row1['id']?>">
                no.<?=$row1['id'].' : '.$row1['block_name']?>
            </div>
          <?php } ?>
        </div>
        <div>
          <?php if($sidebar_left){?>
          <div class="side_left">
            <div id="side_left" class="droptrue">
              오른쪽
            </div>
          </div>
          <?php }?>
          <?php
          if(!($sidebar_left && $sidebar_right)){ $content_wrap2_width = 'style="width:100%"'; }
          ?>
          <div class="content_wrap2" <?=$content_wrap2_width?>>
            <div id="sortable3" class="droptrue">
              컨텐츠영역
              <?php
                $item_sql2 = " SELECT * FROM g5_content_block WHERE id IN ({$contentQuery}'')";
                $item_result2 = sql_query($item_sql2);
                for ($i=0; $row2=sql_fetch_array($item_result2); $i++) {
                ?>
                <div class="item" id="<?=$row2['id']?>">
                    no.<?=$row2['id'].' : '.$row2['block_name']?>
                </div>
              <?php } ?>
            </div>
          </div>
          <?php if($sidebar_right){?>
          <div class="side_right">
            <div id="side_right" class="droptrue">
              오른쪽
            </div>
          </div>
          <?php }?>
        </div>
        <div id="sortable4" class="droptrue">
          하단영역
          <?php
            $item_sql3 = " SELECT * FROM g5_content_block WHERE id IN ({$footerQuery}'')";
            $item_result3 = sql_query($item_sql3);
            for ($i=0; $row3=sql_fetch_array($item_result3); $i++) {
            ?>
            <div class="item" id="<?=$row3['id']?>">
                no.<?=$row3['id'].' : '.$row3['block_name']?>
            </div>
          <?php } ?>
        </div>
      </div>
      <?php if($b_sidebar_right){?>
      <div class="b_side_right">
        <div id="b_side_right" class="droptrue">
          큰 오른쪽
        </div>
      </div>
      <?php }?>
    </div>
  </div>
</div>
</section>

<div style="clear:both;"></div>

<div class="btn_fixed_top btn_confirm">
  <a href="./block_setup.php" class="btn btn_02">이전</a>
  <a href="#" id="send" class="btn btn_01">업데이트</a>
</div>

<script>
/*
function side_position(ed){
  if($('input:checkbox[name="side_position"]').is(":checked")){
    alert(ed);
    //window.location.reload(true); //현재화면 새로고침
  }else{
    alert('체크풀림');
  }
}
*/
</script>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
