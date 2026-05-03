<?php
$sub_menu = "600300";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$name = $_GET['name'];
$mode1 = $_GET['mode1'];
$g5['title'] = $name."파일수정";
include_once(G5_ADMIN_PATH.'/admin.head.php');

if($mode1 == 'css'){
  $namearr = explode('.css',$name);
}else if($mode1 == 'js'){
  $namearr = explode('.js',$name);
}
$mode = $namearr[1];
$name1 = $namearr[0];

if($mode1 == 'css'){
  $file_path = G5_THEME_PATH.'/css/';
}else if($mode1 == 'js'){
  $file_path = G5_THEME_PATH.'/js/';
}
?>
<style>
textarea {font-size: 14px;}
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/3.19.0/codemirror.css">

<form name="fconfigform" id="fconfigform" method="post" action="./block_setup_edit_up.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">
<input type="hidden" name="name" value="<?=$name?>">
<input type="hidden" name="mode" value="<?=$mode?>">

<section id="anc_cf_block">

  <div class="local_desc01 local_desc" style="background:#e3e3e3;">
    <p>
    FTP 프로그램으로 접속후, 해당 파일을 다운로드 하고, 수정해서 올리거나, 웹에디터의 FTP기능으로 연결후 파일을 수정 할 수 있습니다.
    </p>
  </div>

  <h2 class="h2_frm"><?=$file_path.$name?></h2>
    <div class="tbl_frm01 tbl_wrap">
      <table>
        <tbody>
        <tr>
          <td>
            <?php
            $cssFile = $fp = fopen($file_path.$name, 'r');
            if ($cssFile) {
               $content_css = '';
               while ($line = fgets($fp, 1024)) {
                  $content_css .= $line;
               }
            }
            ?>
            <textarea name="file" style="height:600px;"><?=$content_css?></textarea>
            <?php fclose($cssFile); ?>
          </td>
        </tr>
        </tbody>
      </table>
    </div>


</section>

<div class="btn_fixed_top btn_confirm">
  <a href="./block_setup.php" class="btn btn_02">취소</a>
  <input type="submit" value="업데이트" class="btn_submit btn" accesskey="s">
</div>

</form>
<script>
// 미리보기
function preview(name){
  window.open('<?=G5_THEME_URL?>/preview.php?name='+name+'');
}
// 이미지소스 카피
$('.img_copy').on('click',function(){
  $(this).select();
  document.execCommand('copy');
  alert('내용이 복사 되었습니다.');
});
</script>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
