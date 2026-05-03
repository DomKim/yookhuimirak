<?php
$sub_menu = "700100";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "RSS&사이트맵 설정";
include_once(G5_ADMIN_PATH.'/admin.head.php');

$sql = " select * from g5_rss_sitemap where id = 1";
$result = sql_fetch($sql);
?>

<form name="fconfigform" id="fconfigform" method="post" action="rss_sitemap_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">

<section>
    <h2 class="h2_frm">RSS&사이트맵 설정</h2>

    <div class="local_desc01 local_desc">
          홈페이지의 RSS / 사이트맵을 생성및 설정을 합니다.
    </div>

    <div class="tbl_frm01 tbl_wrap ">
      <table>
        <thead>
          <colgroup>
            <col style="width:20%;">
          </colgroup>
        </thead>
        <tbody>
        <tr>
          <th scope="row">RSS 설정</th>
          <td>
            <a href="<?=G5_URL?>/rss.php" target="_blank"><?=G5_URL?>/rss.php</a> <br><br>
            사이트설명 : <input type="text" name="rss_description" class="frm_input" value="<?=$result['rss_descript']?>"><br><br>
            RSS 갯수설정 : <input type="text" name="rss_count" class="frm_input" value="<?=$result['rss_count']?>"><br><br>
            노출 :
            <?php
            // RSS 데이터 배열
            $rss_result = explode('|',$result['rss_result']);
            $rss_result1 = $rss_result[0];
            $rss_result2 = $rss_result[1];
            $rss_result3 = $rss_result[2];
            $rss_result4 = $rss_result[3];
            ?>
            <input type="checkbox" name="rss_result[]" value="컨텐츠" <?php if($rss_result1=='컨텐츠')echo 'checked';?>> 컨텐츠
            <input type="hidden" name="rss_result_count[]">
            <input type="checkbox" name="rss_result[]" value="게시물" <?php if($rss_result2=='게시물')echo 'checked';?>> 게시물
            <input type="hidden" name="rss_result_count[]">
            <input type="checkbox" name="rss_result[]" value="영카트" <?php if($rss_result3=='영카트')echo 'checked';?>> 영카트
            <input type="hidden" name="rss_result_count[]">
            <input type="checkbox" name="rss_result[]" value="컨텐츠몰" <?php if($rss_result4=='컨텐츠몰')echo 'checked';?>> 컨텐츠몰
            <input type="hidden" name="rss_result_count[]">
          </td>
        </tr>
        <tr>
          <th scope="row">사이트맵 설정</th>
          <td>
            <a href="<?=G5_URL?>/sitemap.php" target="_blank"><?=G5_URL?>/sitemap.php</a> <br><br>
            사이트맵 갯수설정 : <input type="text" name="sitemap_count" class="frm_input" value="<?=$result['sitemap_count']?>"><br><br>
            노출 :
            <?php
            // 사이트맵 데이터 배열
            $sitemap_result = explode('|',$result['sitemap_result']);
            $sitemap_result1 = $sitemap_result[0];
            $sitemap_result2 = $sitemap_result[1];
            $sitemap_result3 = $sitemap_result[2];
            $sitemap_result4 = $sitemap_result[3];
            ?>
            <input type="checkbox" name="sitemap_result[]" value="컨텐츠" <?php if($sitemap_result1=='컨텐츠')echo 'checked';?>> 컨텐츠
            <input type="hidden" name="sitemap_result_count[]">
            <input type="checkbox" name="sitemap_result[]" value="게시물" <?php if($sitemap_result2=='게시물')echo 'checked';?>> 게시물
            <input type="hidden" name="sitemap_result_count[]">
            <input type="checkbox" name="sitemap_result[]" value="영카트" <?php if($sitemap_result3=='영카트')echo 'checked';?>> 영카트
            <input type="hidden" name="sitemap_result_count[]">
            <input type="checkbox" name="sitemap_result[]" value="컨텐츠몰" <?php if($sitemap_result4=='컨텐츠몰')echo 'checked';?>> 컨텐츠몰
            <input type="hidden" name="sitemap_result_count[]">
          </td>
        </tr>
        </tbody>
      </table>
    </div>
</section>



<div class="btn_fixed_top btn_confirm">
  <input type="submit" value="설정" name="act_button" class="btn_submit btn" accesskey="s">
</div>



</form>

<script>
// 삭제.
function send_del(name,part){
  var delalert = confirm("정말 삭제 하시겠습니까?");
  if(delalert == true){
    location.href="./block_setup_update.php?w=d&name="+name+"&part="+part;
  }
}
</script>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
