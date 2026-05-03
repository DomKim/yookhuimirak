<?php
$sub_menu = "700300";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "워터마크 설정";
include_once(G5_ADMIN_PATH.'/admin.head.php');

?>

<form name="fconfigform" id="fconfigform" method="post" action="./watermark_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">

<section>
    <h2 class="h2_frm">워터마크 설정</h2>

    <div class="local_desc01 local_desc">
      글쓰기시 첨부파일이미지 또는 에디터에 첨부하는 이미지에 워터마크를 표시합니다.
    </div>

    <div class="tbl_frm01 tbl_wrap">
      <input type="file" name="file_upload" id="file_upload">
      <input type="submit" value="파일업로드" name="act_button" class="btn_submit btn" accesskey="s">
    </div>

    <div class="tbl_frm01 tbl_wrap" style="display:table;">
      <?php
      $watermark_img = G5_THEME_PATH."/act/watermark.gif";
      if (file_exists($watermark_img))
      {
          $size = getimagesize($watermark_img);
      ?>
      <img src="<?=G5_THEME_URL?>/act/watermark.gif" style="max-width:100%;">
      <br><br>
      <input type="submit" value="워터마크 파일삭제" name="act_button" class="btn_submit btn" accesskey="s">
      <?php } ?>

    </div>

</section>

<!--
<section>
    <h2 class="h2_frm">워터마크 위치설정</h2>

    <div class="tbl_frm01 tbl_wrap">

    </div>
</section>
-->


<div class="btn_fixed_top btn_confirm">
  <input type="submit" value="설정" name="act_button" class="btn_submit btn" accesskey="s">
</div>



</form>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
