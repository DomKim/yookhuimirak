<?php
if($_GET['name'] == 'mainpage'){
  $sub_menu = "600300";
}else{
  $sub_menu = "600400";
}

include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
if($_GET['name'] == 'mainpage'){
  $g5['title'] = "메인페이지 레이아웃 설정";
}else{
  $g5['title'] = "페이지 설정";
}
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

$sql2 = " select * from g5_layout_css_set where name = '".$page_name."' ";
$result2 = sql_fetch($sql2);

for ($i=0; $row1=sql_fetch_array($result1); $i++) {
  $empty_area .= $row1['empty_area'];
  $head_area .= $row1['head_area'];
  $content_area .= $row1['content_area'];
  $footer_area .= $row1['footer_area'];

  $left_sidebar_area .= $row1['left_sidebar_area'];
  $right_sidebar_area .= $row1['right_sidebar_area'];
  $b_left_sidebar_area .= $row1['b_left_sidebar_area'];
  $b_right_sidebar_area .= $row1['b_right_sidebar_area'];

  $sidebar_position .= $row1['sidebar_position'];
}
//echo $b_right_sidebar_area;
include_once(G5_ADMIN_PATH.'/design_admin/block_setup_layout_css.php');
?>
<script src="<?=G5_ADMIN_URL?>/design_admin/js/url2img.js"></script>

<style>
.item img {width:100%;}
</style>

<form name="fconfigform" id="fconfigform" method="post" action="./block_setup_layout_up.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">
<input type="hidden" name="name" value="<?=$page_name?>" id="name">
<section>

<div>
  <h2 class="h2_frm">사이드바 사용</h2>
  <div class="tbl_frm01 tbl_wrap">
    <table>
      <tbody>

      <tr>
          <th scope="row">사이드바 위치설정</th>
          <td>
            <?php
            $position_arr = explode('|',$sidebar_position);
            for ($i=1; $i < count($position_arr); $i++) {
              $position1 = $position_arr[1];
              $position2 = $position_arr[2];
              $position3 = $position_arr[3];
              $position4 = $position_arr[4];
            }

            if($_GET['name'] == 'mainpage'){
            ?>
              <input type="checkbox" name="side_position1" value="left" <?php if($position1 == 'left'){echo "checked";}?>>왼쪽
              <input type="checkbox" name="side_position2" value="right" <?php if($position2 == 'right'){echo "checked";}?>>오른쪽
            <?php }?>
              <input type="checkbox" name="side_position3" value="b_left" <?php if($position3 == 'b_left'){echo "checked";}?>>큰왼쪽
              <input type="checkbox" name="side_position4" value="b_right" <?php if($position4 == 'b_right'){echo "checked";}?>>큰오른쪽
              <input type="submit" value="사이드바 설정" name="act_button" class="btn_submit btn" accesskey="s">
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
          $whereQuery .= "'".$head_arr[$f]."',"; $headQuery .= "'".$head_arr[$f]."',";
        }

        $content_arr = explode('|',$content_area);
        for ($f=1; $f < count($content_arr); $f++) {
          $whereQuery .= "'".$content_arr[$f]."',"; $contentQuery .= "'".$content_arr[$f]."',";
        }

        $footer_arr = explode('|',$footer_area);
        for ($f=1; $f < count($footer_arr); $f++) {
          $whereQuery .= "'".$footer_arr[$f]."',"; $footerQuery .= "'".$footer_arr[$f]."',";
        }

        $left_sidebar_arr = explode('|',$left_sidebar_area);
        for ($f=1; $f < count($left_sidebar_arr); $f++) {
          $whereQuery .= "'".$left_sidebar_arr[$f]."',"; $left_sidebar_Query .= "'".$left_sidebar_arr[$f]."',";
        }

        $right_sidebar_arr = explode('|',$right_sidebar_area);
        for ($f=1; $f < count($right_sidebar_arr); $f++) {
          $whereQuery .= "'".$right_sidebar_arr[$f]."',"; $right_sidebar_Query .= "'".$right_sidebar_arr[$f]."',";
        }

        $b_left_sidebar_arr = explode('|',$b_left_sidebar_area);
        for ($f=1; $f < count($b_left_sidebar_arr); $f++) {
          $whereQuery .= "'".$b_left_sidebar_arr[$f]."',"; $b_left_sidebar_Query .= "'".$b_left_sidebar_arr[$f]."',";
        }

        $b_right_sidebar_arr = explode('|',$b_right_sidebar_area);
        for ($f=1; $f < count($b_right_sidebar_arr); $f++) {
          $whereQuery .= "'".$b_right_sidebar_arr[$f]."',"; $b_right_sidebar_Query .= "'".$b_right_sidebar_arr[$f]."',";
        }

        $sql = " SELECT * FROM g5_content_block WHERE id NOT IN ({$whereQuery}'') ";

        $result = sql_query($sql);

        for ($i=0; $row=sql_fetch_array($result); $i++) {
          ?>
        <div class="item" id="<?=$row['id']?>">
          <div class="title">
            <i class="fa fa-bars move"></i>
            <?=$row['block_name']?>
          </div>
          <?php
          $screen_img = G5_THEME_PATH."/template/".$row['block_name']."/screenshot.png";
          if (file_exists($screen_img)){ ?>
            <img src="<?=G5_THEME_URL?>/template/<?=$row['block_name']?>/screenshot.png" style="width:100%;">
          <?php }else{?>
            <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row['block_name']?>" alt="<?=$row['block_name']?>" style="width:100%;">
          <?php }?>
        </div>
        <?php
        }

      ?>
    </div>
  </div>

  <div class="layout">
    <div class="layout_content">
      <h2 class="h2_frm">레이아웃</h2>
      <?php if($position3){$position3_display = 'display:block';}else{$position3_display = 'display:none';}?>
      <div class="b_side_left" style="<?=$position3_display?>">
        큰 왼쪽 [#b_left]
        <div id="b_side_left" class="droptrue">
        <?php
          $item_sql1 = " SELECT * FROM g5_content_block WHERE id IN ({$b_left_sidebar_Query}'') ORDER BY FIELD(id, {$b_left_sidebar_Query}'')";
          $item_result1 = sql_query($item_sql1);
          for ($i=0; $row1=sql_fetch_array($item_result1); $i++) {
          ?>
          <div class="item" id="<?=$row1['id']?>">
            <div class="title">
              <i class="fa fa-bars move"></i>
              <?=$row1['block_name']?>
            </div>
            <?php
            $screen_img = G5_THEME_PATH."/template/".$row1['block_name']."/screenshot.png";
            if (file_exists($screen_img)){ ?>
              <img src="<?=G5_THEME_URL?>/template/<?=$row1['block_name']?>/screenshot.png" style="width:100%;">
            <?php }else{?>
              <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row1['block_name']?>" alt="<?=$row1['block_name']?>" style="width:100%;">
            <?php }?>
          </div>
        <?php } ?>
        </div>
      </div>

      <?php
      if(!($position3 && $position4)){ $content_wrap_width = 'style="width:100%"'; }
      if($position3 || $position4){ $content_wrap_width = ''; }
      ?>
      <div class="content_wrap" <?=$content_wrap_width?>>
        [#page_wrap]<br>
          상단영역 [#head]
        <div id="sortable2" class="droptrue">

          <?php
            $item_sql1 = " SELECT * FROM g5_content_block WHERE id IN ({$headQuery}'') ORDER BY FIELD(id, {$headQuery}'')";
            $item_result1 = sql_query($item_sql1);
            for ($i=0; $row1=sql_fetch_array($item_result1); $i++) {
            ?>
            <div class="item" id="<?=$row1['id']?>">
              <div class="title">
                <i class="fa fa-bars move"></i>
                <?=$row1['block_name']?>
              </div>
              <?php
              $screen_img = G5_THEME_PATH."/template/".$row1['block_name']."/screenshot.png";
              if (file_exists($screen_img)){ ?>
                <img src="<?=G5_THEME_URL?>/template/<?=$row1['block_name']?>/screenshot.png" style="width:100%;">
              <?php }else{?>
                <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row1['block_name']?>" alt="<?=$row1['block_name']?>" style="width:100%;">
              <?php }?>
            </div>
          <?php } ?>
        </div>
        <div>
          <?php if($position1){$position1_display = 'display:block';}else{$position1_display = 'display:none';}?>
          <div class="side_left" style="<?=$position1_display?>">
            왼쪽 [#left]
            <div id="side_left" class="droptrue">

              <?php
                $item_sql1 = " SELECT * FROM g5_content_block WHERE id IN ({$left_sidebar_Query}'') ORDER BY FIELD(id, {$left_sidebar_Query}'')";
                $item_result1 = sql_query($item_sql1);
                for ($i=0; $row1=sql_fetch_array($item_result1); $i++) {
                ?>
                <div class="item" id="<?=$row1['id']?>">
                  <div class="title">
                    <i class="fa fa-bars move"></i>
                    <?=$row1['block_name']?>
                  </div>
                  <?php
                  $screen_img = G5_THEME_PATH."/template/".$row1['block_name']."/screenshot.png";
                  if (file_exists($screen_img)){ ?>
                    <img src="<?=G5_THEME_URL?>/template/<?=$row1['block_name']?>/screenshot.png" style="width:100%;">
                  <?php }else{?>
                    <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row1['block_name']?>" alt="<?=$row1['block_name']?>" style="width:100%;">
                  <?php }?>
                </div>
              <?php } ?>
            </div>
          </div>
          <?php
          if(!($position1 && $position2)){ $content_wrap2_width = 'style="width:100%"'; }
          if($position1 || $position2){ $content_wrap2_width = ''; }
          ?>
          <div class="content_wrap2" <?=$content_wrap2_width?>>
            컨텐츠영역 [#content_wrap]
            <?php if($_GET['name'] == 'mainpage'){?>
            <div id="sortable3" class="droptrue">

              <?php
                $item_sql2 = " SELECT * FROM g5_content_block WHERE id IN ({$contentQuery}'') ORDER BY FIELD(id, {$contentQuery}'')";
                $item_result2 = sql_query($item_sql2);
                for ($i=0; $row2=sql_fetch_array($item_result2); $i++) {
                ?>
                <div class="item" id="<?=$row2['id']?>">
                  <div class="title">
                    <i class="fa fa-bars move"></i>
                    <?=$row2['block_name']?>
                  </div>
                  <?php
                  $screen_img = G5_THEME_PATH."/template/".$row2['block_name']."/screenshot.png";
                  if (file_exists($screen_img)){ ?>
                    <img src="<?=G5_THEME_URL?>/template/<?=$row2['block_name']?>/screenshot.png" style="width:100%;">
                  <?php }else{?>
                    <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row2['block_name']?>" alt="<?=$row2['block_name']?>" style="width:100%;">
                  <?php }?>
                </div>
              <?php } ?>
            </div>
          <?php }else{?>
            <div style="background:#f3f3f3; height:50px; margin-bottom:10px;">
              <div id="sortable3" class="droptrue" style="display:none;"></div>
            </div>
          <?php }?>
          </div>
          <?php if($position2){$position2_display = 'display:block';}else{$position2_display = 'display:none';}?>
          <div class="side_right" style="<?=$position2_display?>">
            오른쪽 [#right]
            <div id="side_right" class="droptrue">

              <?php
                $item_sql1 = " SELECT * FROM g5_content_block WHERE id IN ({$right_sidebar_Query}'') ORDER BY FIELD(id, {$right_sidebar_Query}'')";
                $item_result1 = sql_query($item_sql1);
                for ($i=0; $row1=sql_fetch_array($item_result1); $i++) {
                ?>
                <div class="item" id="<?=$row1['id']?>">
                  <div class="title">
                    <i class="fa fa-bars move"></i>
                    <?=$row1['block_name']?>
                  </div>
                  <?php
                  $screen_img = G5_THEME_PATH."/template/".$row1['block_name']."/screenshot.png";
                  if (file_exists($screen_img)){ ?>
                    <img src="<?=G5_THEME_URL?>/template/<?=$row1['block_name']?>/screenshot.png" style="width:100%;">
                  <?php }else{?>
                    <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row1['block_name']?>" alt="<?=$row1['block_name']?>" style="width:100%;">
                  <?php }?>
                </div>
              <?php } ?>
            </div>
          </div>
        </div>

        <div style="clear:both;">
        하단영역 [#footer]
        <div id="sortable4" class="droptrue">

          <?php
            $item_sql3 = " SELECT * FROM g5_content_block WHERE id IN ({$footerQuery}'') ORDER BY FIELD(id, {$footerQuery}'')";
            $item_result3 = sql_query($item_sql3);
            for ($i=0; $row3=sql_fetch_array($item_result3); $i++) {
            ?>
            <div class="item" id="<?=$row3['id']?>">
              <div class="title">
                <i class="fa fa-bars move"></i>
                <?=$row3['block_name']?>
              </div>
              <?php
              $screen_img = G5_THEME_PATH."/template/".$row3['block_name']."/screenshot.png";
              if (file_exists($screen_img)){ ?>
                <img src="<?=G5_THEME_URL?>/template/<?=$row3['block_name']?>/screenshot.png" style="width:100%;">
              <?php }else{?>
                <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row3['block_name']?>" alt="<?=$row3['block_name']?>" style="width:100%;">
              <?php }?>
            </div>
          <?php } ?>
        </div>
        </div>
      </div>
      <?php if($position4){$position4_display = 'display:block';}else{$position4_display = 'display:none';}?>
      <div class="b_side_right" style="<?=$position4_display?>">
        큰 오른쪽 [#b_right]
        <div id="b_side_right" class="droptrue">

          <?php
            $item_sql1 = " SELECT * FROM g5_content_block WHERE id IN ({$b_right_sidebar_Query}'') ORDER BY FIELD(id, {$b_right_sidebar_Query}'')";
            $item_result1 = sql_query($item_sql1);
            for ($i=0; $row1=sql_fetch_array($item_result1); $i++) {
            ?>
            <div class="item" id="<?=$row1['id']?>">
              <div class="title">
                <i class="fa fa-bars move"></i>
                <?=$row1['block_name']?>
              </div>
              <?php
              $screen_img = G5_THEME_PATH."/template/".$row1['block_name']."/screenshot.png";
              if (file_exists($screen_img)){ ?>
                <img src="<?=G5_THEME_URL?>/template/<?=$row1['block_name']?>/screenshot.png" style="width:100%;">
              <?php }else{?>
                <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row1['block_name']?>" alt="<?=$row1['block_name']?>" style="width:100%;">
              <?php }?>
            </div>
          <?php } ?>
        </div>
      </div>
    </div>
  </div>
</div>






<?php
if($_GET['name'] == 'mainpage'){
?>
<div style="clear:both;">
  <h2 class="h2_frm">레이아웃 CSS</h2>
  <div class="tbl_frm01 tbl_wrap">
    <table>
      <tbody>

      <tr>
          <th scope="row">css 변수설정</th>
          <td style="line-height:25px">
            .container { width : <input type="text" name="container" value="<?=$result2['css_1']?>"> }<br>
            <?php if($position3){?>
            #b_left { width : <input type="text" name="b_left" value="<?=$result2['css_2']?>"> }<br>
            <?php }?>
            <?php if($position4){?>
            #b_right { width : <input type="text" name="b_right" value="<?=$result2['css_3']?>"> }<br>
            <?php }?>
            <?php if($position1){?>
            #left { width : <input type="text" name="left" value="<?=$result2['css_4']?>"> }<br>
            <?php }?>
            <?php if($position2){?>
            #right { width : <input type="text" name="right" value="<?=$result2['css_5']?>"> }<br>
            <?php }?>
            #page_wrap { width : <input type="text" name="page_wrap" value="<?=$result2['css_6']?>"> }<br>
            #content_wrap { width : <input type="text" name="content_wrap" value="<?=$result2['css_7']?>"> }<br><br>
            디바이스 가로사이즈 <br>
            태블릿 <input type="text" name="tb" value="<?=$result2['css_8']?>"> px<br>
            모바일 <input type="text" name="mo" value="<?=$result2['css_9']?>"> px<br>
            <!--container 사이즈고정 (반응형 사용안함.) <input type="checkbox" name="relative" value="relative" <?php if($result2['css_10']=='relative'){echo 'checked';}?> >-->
            <br>
            <input type="submit" value="CSS 설정" name="act_button" class="btn_submit btn" accesskey="s">
          </td>
      </tr>

      </tbody>
    </table>
  </div>
</div>
<?php }?>



</section>

<div style="clear:both;"></div>

<div class="btn_fixed_top btn_confirm">
  <?php if($_GET['name'] == 'mainpage'){ ?>
  <a href="./block_setup.php" class="btn btn_02">이전</a>
  <?php }else{?>
  <a href="./page_design.php" class="btn btn_02">이전</a>
  <a href="<?=G5_BBS_URL?>/content.php?co_id=<?=$page_name?>" target="_blank" class="btn btn_02">미리보기</a>
  <?php }?>
  <a href="#" id="send" class="btn btn_01">업데이트</a>
</div>
</form>
<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
