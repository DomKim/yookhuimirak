<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가
include_once(G5_LIB_PATH.'/thumbnail.lib.php');

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);
?>

<?php if ($is_category) { ?>
<nav id="bo_cate">
    <h2><?php echo $board['bo_subject'] ?> 카테고리</h2>
    <ul id="bo_cate_ul">
        <?php echo $category_option ?>
    </ul>
</nav>
<?php } ?>

<form name="fboardlist"  id="fboardlist" action="./board_list_update.php" onsubmit="return fboardlist_submit(this);" method="post">
<input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
<input type="hidden" name="sfl" value="<?php echo $sfl ?>">
<input type="hidden" name="stx" value="<?php echo $stx ?>">
<input type="hidden" name="spt" value="<?php echo $spt ?>">
<input type="hidden" name="sst" value="<?php echo $sst ?>">
<input type="hidden" name="sod" value="<?php echo $sod ?>">
<input type="hidden" name="page" value="<?php echo $page ?>">
<input type="hidden" name="sw" value="">


<div class="member_title margin-30">
  <?php echo $board['bo_subject'];?>
</div>


<div class="margin-responsive-30" style="background:#fff; padding: 15px; margin-bottom:30px;">

<div class="uk-overflow-auto">
<table class="uk-table uk-table-responsive uk-table-hover uk-table-divider">
    <thead style="background:#f3f3f3;">
        <tr>
            <th class="text-center">이름</th>
            <th class="text-center">제목[지점]</th>
            <th class="text-center">아이피</th>
            <th class="text-center">답변방법</th>
            <th class="text-center">신청일시</th>
            <th class="text-center">상태</th>
            <th class="text-center">답변자</th>
            <th class="text-center">답변일시</th>
            <th class="text-center">장치</th>
            <!--<th>승인여부</th>-->
        </tr>
    </thead>
    <tbody>

        <?php for ($i=0; $i<count($list); $i++) {
          $thumb = get_list_thumbnail($board['bo_table'], $list[$i]['wr_id'], $board['bo_gallery_width'], $board['bo_gallery_height']);
          if($thumb['src']) {
            $img_content = '<img src="'.$thumb['src'].'" alt="'.$thumb['alt'].'">';
          } else {
            $img_content = '<i class="fa fa-picture-o"></i>';
          }
         ?>
         <tr>
           <td><a href="<?php echo $list[$i]['href'] ?>"><?php echo $list[$i]['wr_name'] ?></a></td>
           <td class="text-center"><?php echo $list[$i]['wr_subject'] ?></td>
           <td class="text-center"><?php echo $list[$i]['wr_ip']?></td>
           <td class="text-center"><?php echo $list[$i]['wr_1']?></td>
           <td class="text-center"><?php echo $list[$i]['datetime']?></td>
           <td class="text-center"><?php if($list[$i]['wr_4'] == '답변완료') echo '<font color="red">'.$list[$i]['wr_4'].'</font>'; else echo $list[$i]['wr_4']?></td>
           <td class="text-center"><?php echo $list[$i]['wr_5']?></td>
           <td class="text-center"><?php echo $list[$i]['wr_last']?></td>
           <td class="text-center"><?php if($list[$i]['wr_8'] == 'P'){ echo 'PC';}else{ echo '모바일';}?></td>
          </tr>
          <?php } ?>
          <?php if (count($list) == 0) { echo "<tr><td colspan=9 align=center>게시물이 없습니다.</td></tr>"; } ?>


    </tbody>
</table>
</div>

</div>

</form>


<!-- 페이지 -->
<?php echo $write_pages;  ?>

<!-- 게시물 검색 시작 { -->
<div class="text-center margin-20" style="padding:0px 15px;">
  <div class="uk-margin" uk-grid>

      <form name="fsearch" method="get" style="width:100%">
        <input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
        <input type="hidden" name="sca" value="<?php echo $sca ?>">
        <input type="hidden" name="sop" value="and">

        <div class="width-20">
          <div class="uk-form-controls">
              <select class="uk-select" name="sfl" id="sfl">
                  <option value="wr_subject"<?php echo get_selected($sfl, 'wr_subject'); ?> selected>이름</option>
                  <option value="wr_1"<?php echo get_selected($sfl, 'wr_1'); ?>>직위</option>
              </select>
          </div>
        </div>

        <div class="uk-search uk-search-default width-80" >
          <span uk-search-icon></span>
          <input class="uk-search-input" name="stx" type="search" value="<?php echo stripslashes($stx) ?>" required id="stx" placeholder="검색" style="background:#fff;">
        </div>
      </form>
  </div>
</div>
<!-- } 게시물 검색 끝 -->




<div class="text-center" style="padding:0px 15px;">
  <?php if ($list_href || $write_href) { ?>
      <?php if ($list_href) { ?><a href="<?php echo $list_href ?>" class="uk-button uk-button-primary uk-width-1-1" style="color:#fff; background:<?php echo $theme_color_bar ?>;" >목록</a><?php } ?>
      <?php if ($write_href) { ?><a href="<?php echo $write_href ?>" class="uk-button uk-button-primary uk-width-1-1 margin-10" style="color:#fff; background:<?php echo $theme_color_bar ?>;" ><?php echo $board['bo_subject'];?> 등록</a><?php } ?>
  <?php } ?>
</div>






<?php if($is_checkbox) { ?>
<noscript>
<p>자바스크립트를 사용하지 않는 경우<br>별도의 확인 절차 없이 바로 선택삭제 처리하므로 주의하시기 바랍니다.</p>
</noscript>
<?php } ?>





<script>


</script>
<!-- } 게시판 목록 끝 -->
