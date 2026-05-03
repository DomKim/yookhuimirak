<?php
$sub_menu = "600260";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "게시판스킨 관리";
include_once(G5_ADMIN_PATH.'/admin.head.php');


$sql = " select count(*) as cnt from g5_content_block ";
$row = sql_fetch($sql);
$total_count = $row['cnt'];

$sql = " select * from g5_content_block ";
$result = sql_query($sql);
?>
<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
<script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/js/url2img.js"></script>

<style>
.ui-widget-overlay {background: #000;}
#option {display:none;}
</style>

<form name="fconfigform" id="fconfigform" method="post" action="./board_skin_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">

<section id="anc_cf_block">

  <div class="local_desc01 local_desc">
        게시판스킨을 추가및 수정을 할수 있습니다.
  </div>

    <h2 class="h2_frm">게시판스킨 생성</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <caption>게시판스킨 생성</caption>
        <colgroup>
            <col class="grid_4">
            <col>
            <col class="grid_4">
            <col>
        </colgroup>
        <tbody>

        <tr>
            <td>
                <span class="frm_info">
                  생성될 파일명을 입력합니다. 확장자는 입력하지 않습니다.<br>
                  <?=G5_THEME_PATH?>/skin/board/ 폴더에 폴더및 파일이 생성 됩니다.<br>
                  한글사용/특수문자 안됩니다. 영문 또는 영문+숫자만 가능합니다.
                </span>
                <input type="text" name="file_name" class="frm_input" placeholder="파일이름">
                <input type="submit" value="생성" name="act_button" class="btn_submit btn" accesskey="s">
            </td>
        </tr>

        </tbody>
      </table>
    </div>



    <h2 class="h2_frm">게시판스킨 업로드</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <caption>게시판스킨 업로드</caption>
        <colgroup>
            <col class="grid_4">
            <col>
            <col class="grid_4">
            <col>
        </colgroup>
        <tbody>

        <tr>
            <td>
                <span class="frm_info">따로 만들어지거나, 게시판스킨파일을 업로드 합니다. 업로드 파일은 파일명.zip 만 가능 합니다.</span>
                <input type="file" name="file_upload[]" id="file_upload" multiple="multiple" style="float:left;">
                <input type="submit" value="파일업로드" name="act_button" class="btn_submit btn" accesskey="s">
            </td>
        </tr>

        </tbody>
      </table>
    </div>





    <h2 class="h2_frm">게시판스킨</h2>
    <div class="tbl_frm01 tbl_wrap">

    <?php


    $dir = G5_THEME_PATH."/skin/board";
    if(is_dir($dir)) {
        if($dh = opendir($dir)) {
            while(($entry = readdir($dh)) !== false) {
                if($entry == '.' || $entry == '..')
                    continue;
                $subdir = $dir.'/'.$entry;
                if(is_dir($subdir)) {
                  ?>

                  <div style="width:33%; float:left; text-align:center; padding:10px;">
                    <div style="border:1px solid #e3e3e3; padding:10px; background:#fff;">
                        <br><center><strong style="font-size:18px;"><?=$entry?></strong></center><br>
                        <div style="width:100%; height:250px; overflow:hidden;">
                        <a href="javascript:preview('<?=$entry?>');">
                          <?php
                          $screen_img = G5_THEME_PATH."/template/".$row['block_name']."/screenshot.png";
                          if (file_exists($screen_img)){ ?>
                            <img src="<?=G5_THEME_URL?>/template/<?=$row['block_name']?>/screenshot.png" style="width:100%;">
                          <?php }else{?>
                            <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/latest_preview.php?name=<?=$entry?>" alt="<?=$entry?>" style="width:100%;">
                          <?php }?>
                        </a>
                        </div>
                        <br><br>
                        <!--폴더경로 : <?=G5_THEME_PATH?>/template/<?=$row['block_name']?><br>-->

                        <div style="background:#e3e3e3; padding:10px;">
                        <a href="javascript:blockDownload('<?=$entry?>');" class="btn btn_03" title="다운로드"><i class="fa fa-download"></i></a>
                        <a href="javascript:preview('<?=$entry?>');" class="btn btn_02" title="미리보기"><i class="fa fa-search"></i></a>
                        &nbsp;
                        <a href="./board_skin_edit.php?name=<?=$entry?>" class="btn btn_01">수정</a>
                        <a href="javascript:send_update('<?=$entry?>','');" class="btn btn_02 send_update">삭제</a>
                        </div>
                    </div>
                  </div>


                  <?php
                  //echo $entry.'<br>';
                }
            }
            closedir($dh);
        }
    }
    ?>



  </div>
  <div style="clear:both;"></div>

</section>

</form>





<script>
// 삭제.
function send_update(name,id){
  var delalert = confirm("정말 삭제 하시겠습니까?");
  if(delalert == true){
    location.href="./board_skin_update.php?w=d&file_name="+name+"&id="+id+"";
  }
}
// 미리보기
function preview(name){
  window.open('<?=G5_THEME_URL?>/latest_preview.php?name='+name+'');
}
// 블럭 다운로드
function blockDownload(name) {
  location.href="./board_skin_update.php?w=download&file_name="+name;
}


</script>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
