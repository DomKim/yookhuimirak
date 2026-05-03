<?php
$sub_menu = "600200";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "컨텐츠 블럭";
include_once(G5_ADMIN_PATH.'/admin.head.php');


$sql = " select count(*) as cnt from g5_content_block ";
$row = sql_fetch($sql);
$total_count = $row['cnt'];

$sql = " select * from g5_content_block ";
$result = sql_query($sql);
?>
<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
<script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
<!-- <script src="<?=G5_ADMIN_URL?>/design_admin/js/url2img.js"></script> -->

<style>
.ui-widget-overlay {background: #000;}
#option {display:none;}
</style>

<form name="fconfigform" id="fconfigform" method="post" action="./content_block_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">

<section id="anc_cf_block">

  <div class="local_desc01 local_desc">
    <p>
        메인페이지를 구성하는 블럭을 생성 합니다.<br>
        생성된 블럭은 관리자에서 수정가능 하며, 또는 웹에디터에서 FTP접속후 수정가능 합니다.
    </p>
  </div>

    <h2 class="h2_frm">컨텐츠 블럭 생성</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <caption>컨텐츠 블럭 생성</caption>
        <colgroup>
            <col class="grid_4">
            <col>
            <col class="grid_4">
            <col>
        </colgroup>
        <tbody>

        <tr>
            <th scope="row">파일 이름</th>
            <td>
                <span class="frm_info">생성될 파일명을 입력합니다. 확장자는 입력하지 않습니다.<br>
                  <?=G5_THEME_PATH?>/template 폴더에 파일이 생성 됩니다.<br>
                  한글사용/특수문자 안됩니다. 영문 또는 영문+숫자만 가능합니다.
                </span>
                <input type="text" name="file_name" class="frm_input" placeholder="파일이름">
                <input type="submit" value="생성" name="act_button" class="btn_submit btn" accesskey="s">
            </td>
        </tr>

        </tbody>
      </table>
    </div>



    <h2 class="h2_frm">컨텐츠 블럭 가져오기</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <caption>컨텐츠 블럭 가져오기</caption>
        <colgroup>
            <col class="grid_4">
            <col>
            <col class="grid_4">
            <col>
        </colgroup>
        <tbody>

        <tr>
            <th scope="row">파일 업로드</th>
            <td>
                <span class="frm_info">따로 만들어지거나, 블럭파일을 업로드 합니다. 업로드 파일은 파일명.zip 만 가능 합니다.</span>
                <input type="file" name="file_upload[]" id="file_upload" multiple="multiple" style="float:left;">
                <input type="submit" value="파일업로드" name="act_button" class="btn_submit btn" accesskey="s">
            </td>
        </tr>

        </tbody>
      </table>
    </div>


    <h2 class="h2_frm">에디터 테마</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <caption>테마선택</caption>
        <colgroup>
            <col class="grid_4">
            <col>
            <col class="grid_4">
            <col>
        </colgroup>
        <tbody>


        <tr>
            <th scope="row">테마선택</th>
            <td>
              <span class="frm_info">테마는 <a href="https://codemirror.net/demo/theme.html" target="_blank">https://codemirror.net/demo/theme.html</a> 에서 미리보기 가능합니다 .</span>
                <select name="theme" id="theme">
                  <option value="default" <?php if($_COOKIE['edit_theme'] == 'default'){echo 'selected';}?>>default</option>
                  <option value="3024-day" <?php if($_COOKIE['edit_theme'] == '3024-day'){echo 'selected';}?>>3024-day</option>
                  <option value="3024-night" <?php if($_COOKIE['edit_theme'] == '3024-night'){echo 'selected';}?>>3024-night</option>
                  <option value="abcdef" <?php if($_COOKIE['edit_theme'] == 'abcdef'){echo 'selected';}?>>abcdef</option>
                  <option value="ambiance" <?php if($_COOKIE['edit_theme'] == 'ambiance'){echo 'selected';}?>>ambiance</option>
                  <option value="base16-dark" <?php if($_COOKIE['edit_theme'] == 'base16-dark'){echo 'selected';}?>>base16-dark</option>
                  <option value="base16-light" <?php if($_COOKIE['edit_theme'] == 'base16-light'){echo 'selected';}?>>base16-light</option>
                  <option value="bespin" <?php if($_COOKIE['edit_theme'] == 'bespin'){echo 'selected';}?>>bespin</option>
                  <option value="blackboard" <?php if($_COOKIE['edit_theme'] == 'blackboard'){echo 'selected';}?>>blackboard</option>
                  <option value="cobalt" <?php if($_COOKIE['edit_theme'] == 'cobalt'){echo 'selected';}?>>cobalt</option>
                  <option value="colorforth" <?php if($_COOKIE['edit_theme'] == 'colorforth'){echo 'selected';}?>>colorforth</option>
                  <option value="darcula" <?php if($_COOKIE['edit_theme'] == 'darcula'){echo 'selected';}?>>darcula</option>
                  <option value="dracula" <?php if($_COOKIE['edit_theme'] == 'dracula'){echo 'selected';}?>>dracula</option>
                  <option value="duotone-dark" <?php if($_COOKIE['edit_theme'] == 'duotone-dark'){echo 'selected';}?>>duotone-dark</option>
                  <option value="duotone-light" <?php if($_COOKIE['edit_theme'] == 'duotone-light'){echo 'selected';}?>>duotone-light</option>
                  <option value="eclipse" <?php if($_COOKIE['edit_theme'] == 'eclipse'){echo 'selected';}?>>eclipse</option>
                  <option value="elegant" <?php if($_COOKIE['edit_theme'] == 'elegant'){echo 'selected';}?>>elegant</option>
                  <option value="erlang-dark" <?php if($_COOKIE['edit_theme'] == 'erlang-dark'){echo 'selected';}?>>erlang-dark</option>
                  <option value="gruvbox-dark" <?php if($_COOKIE['edit_theme'] == 'gruvbox-dark'){echo 'selected';}?>>gruvbox-dark</option>
                  <option value="hopscotch" <?php if($_COOKIE['edit_theme'] == 'hopscotch'){echo 'selected';}?>>hopscotch</option>
                  <option value="icecoder" <?php if($_COOKIE['edit_theme'] == 'icecoder'){echo 'selected';}?>>icecoder</option>
                  <option value="idea" <?php if($_COOKIE['edit_theme'] == 'idea'){echo 'selected';}?>>idea</option>
                  <option value="isotope" <?php if($_COOKIE['edit_theme'] == 'isotope'){echo 'selected';}?>>isotope</option>
                  <option value="lesser-dark" <?php if($_COOKIE['edit_theme'] == 'lesser-dark'){echo 'selected';}?>>lesser-dark</option>
                  <option value="lucario" <?php if($_COOKIE['edit_theme'] == 'lucario'){echo 'selected';}?>>lucario</option>
                  <option value="material" <?php if($_COOKIE['edit_theme'] == 'material'){echo 'selected';}?>>material</option>
                  <option value="mbo" <?php if($_COOKIE['edit_theme'] == 'mbo'){echo 'selected';}?>>mbo</option>
                  <option value="mdn-like" <?php if($_COOKIE['edit_theme'] == 'mdn-like'){echo 'selected';}?>>mdn-like</option>
                  <option value="midnight" <?php if($_COOKIE['edit_theme'] == 'midnight'){echo 'selected';}?>>midnight</option>
                  <option value="monokai" <?php if($_COOKIE['edit_theme'] == 'monokai'){echo 'selected';}?>>monokai</option>
                  <option value="neat" <?php if($_COOKIE['edit_theme'] == 'neat'){echo 'selected';}?>>neat</option>
                  <option value="neo" <?php if($_COOKIE['edit_theme'] == 'neo'){echo 'selected';}?>>neo</option>
                  <option value="night" <?php if($_COOKIE['edit_theme'] == 'night'){echo 'selected';}?>>night</option>
                  <option value="oceanic-next" <?php if($_COOKIE['edit_theme'] == 'oceanic-next'){echo 'selected';}?>>oceanic-next</option>
                  <option value="panda-syntax" <?php if($_COOKIE['edit_theme'] == 'panda-syntax'){echo 'selected';}?>>panda-syntax</option>
                  <option value="paraiso-dark" <?php if($_COOKIE['edit_theme'] == 'paraiso-dark'){echo 'selected';}?>>paraiso-dark</option>
                  <option value="paraiso-light" <?php if($_COOKIE['edit_theme'] == 'paraiso-light'){echo 'selected';}?>>paraiso-light</option>
                  <option value="pastel-on-dark" <?php if($_COOKIE['edit_theme'] == 'pastel-on-dark'){echo 'selected';}?>>pastel-on-dark</option>
                  <option value="railscasts" <?php if($_COOKIE['edit_theme'] == 'railscasts'){echo 'selected';}?>>railscasts</option>
                  <option value="rubyblue" <?php if($_COOKIE['edit_theme'] == 'rubyblue'){echo 'selected';}?>>rubyblue</option>
                  <option value="seti" <?php if($_COOKIE['edit_theme'] == 'seti'){echo 'selected';}?>>seti</option>
                  <option value="shadowfox" <?php if($_COOKIE['edit_theme'] == 'shadowfox'){echo 'selected';}?>>shadowfox</option>
                  <option value="the-matrix" <?php if($_COOKIE['edit_theme'] == 'the-matrix'){echo 'selected';}?>>the-matrix</option>
                  <option value="tomorrow-night-bright" <?php if($_COOKIE['edit_theme'] == 'tomorrow-night-bright'){echo 'selected';}?>>tomorrow-night-bright</option>
                  <option value="tomorrow-night-eighties" <?php if($_COOKIE['edit_theme'] == 'tomorrow-night-eighties'){echo 'selected';}?>>tomorrow-night-eighties</option>
                  <option value="ttcn" <?php if($_COOKIE['edit_theme'] == 'ttcn'){echo 'selected';}?>>ttcn</option>
                  <option value="twilight" <?php if($_COOKIE['edit_theme'] == 'twilight'){echo 'selected';}?>>twilight</option>
                  <option value="vibrant-ink" <?php if($_COOKIE['edit_theme'] == 'vibrant-ink'){echo 'selected';}?>>vibrant-ink</option>
                  <option value="xq-dark" <?php if($_COOKIE['edit_theme'] == 'xq-dark'){echo 'selected';}?>>xq-dark</option>
                  <option value="xq-light" <?php if($_COOKIE['edit_theme'] == 'xq-light'){echo 'selected';}?>>xq-light</option>
                  <option value="yeti" <?php if($_COOKIE['edit_theme'] == 'yeti'){echo 'selected';}?>>yeti</option>
                  <option value="zenburn" <?php if($_COOKIE['edit_theme'] == 'zenburn'){echo 'selected';}?>>zenburn</option>
                </select>

                <input type="submit" value="선택" name="act_button" class="btn_submit btn" accesskey="s">
            </td>
        </tr>

        </tbody>
      </table>
    </div>


    <h2 class="h2_frm">생성된 블럭 (<?=$total_count?>)</h2>
    <div class="tbl_frm01 tbl_wrap">

    <?php
    $dir = G5_THEME_PATH."/template";

    for ($i=0; $row=sql_fetch_array($result); $i++) {
    ?>

        <div style="width:33%; float:left; text-align:center; padding:10px;">
          <div style="border:1px solid #e3e3e3; padding:10px; background:#fff;">
              <br><center><strong style="font-size:18px;"><?=$row['block_name']?></strong></center><br>
              <div style="width:100%; height:250px; overflow:hidden;">
              <a href="javascript:preview('<?=$row['block_name']?>');">
                <?php
                $screen_img = G5_THEME_PATH."/template/".$row['block_name']."/screenshot.png";
                if (file_exists($screen_img)){ ?>
                  <img src="<?=G5_THEME_URL?>/template/<?=$row['block_name']?>/screenshot.png" style="width:100%;">
                <?php }else{?>
                  <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" data-url="<?=G5_THEME_URL?>/preview.php?name=<?=$row['block_name']?>" alt="<?=$row['block_name']?>" style="width:100%;">
                <?php }?>
              </a>
              </div>
              <br><br>
              <!--폴더경로 : <?=G5_THEME_PATH?>/template/<?=$row['block_name']?><br>-->

              <div style="padding:10px; border-top:1px solid #e3e3e3;">
                <span class="ect_btn" onclick="option('<?=$row['block_name']?>','<?=$row['bo_table']?>','<?=$row['skin_name']?>','<?=$row['list_count']?>','<?=$row['char_count']?>');" uk-toggle="target: #latest_skin">최근게시물</span>
                <span class="ect_btn" onclick="option2('<?=$row['block_name']?>');" uk-toggle="target: #form_skin">접수폼연동</span>
              </div>
              <div style="background:#e3e3e3; padding:10px;">
              <a href="javascript:blockDownload('<?=$row['block_name']?>');" class="btn btn_03" title="다운로드"><i class="fa fa-download"></i></a>
              <a href="javascript:preview('<?=$row['block_name']?>');" class="btn btn_02" title="미리보기"><i class="fa fa-search"></i></a>
              &nbsp;
              <a href="./content_block_edit.php?name=<?=$row['block_name']?>" class="btn btn_01">수정</a>
              <a href="javascript:send_update('<?=$row['block_name']?>','<?=$row['id']?>');" class="btn btn_02 send_update">삭제</a>
              </div>
          </div>
        </div>

  <?php }?>

  </div>
  <div style="clear:both;"></div>

</section>



<div class="btn_fixed_top btn_confirm">
  <a href="http://temamoa.com/bbs/board.php?bo_table=themes" target="_blank" class="btn btn_submit">컨텐츠블럭 테마샵</a>
</div>


</form>





<!-- 최근게시물 설정 -->
<div id="latest_skin" uk-modal>
    <div class="uk-modal-dialog uk-modal-body">
      <button class="uk-modal-close-default" type="button" uk-close></button>
      <h2 class="uk-modal-title">최근게시물 스킨</h2>

      <form name="fconfigform" method="post" action="./content_block_update.php" onsubmit="return fconfigform_submit(this);">
        <input type="hidden" name="type" value="latest">
        <input type="hidden" name="block_name" value="" id="block_name">
        <table>
          <colgroup>
            <col width="110px">
            <col>
          </colgroup>
          <tr>
            <td>최근게시물 스킨</td>
            <td>
              <select name="skin_name" id="skin_name" class="uk-select">
                <option>선택해주세요.</option>
              <?php
              // 최근게시물 스킨 가져오기
              $dir = G5_THEME_PATH."/skin/latest";
              if(is_dir($dir)) {
                  if($dh = opendir($dir)) {
                      while(($entry = readdir($dh)) !== false) {
                          if($entry == '.' || $entry == '..')
                              continue;
                          $subdir = $dir.'/'.$entry;
                          if(is_dir($subdir)) {
                            echo '<option name="'.$entry.'" >'.$entry.'</option>';
                          }
                      }
                      closedir($dh);
                  }
              }
              ?>
              </select>
            </td>
          </tr>

          <tr>
            <td>연동할 게시판</td>
            <td>
              <?PHP
              // 게시판 이름과 값 가져오기.
              $board_query = 'select * from g5_board';
              $board_sql = sql_query($board_query);
              ?>
              <select name="bo_table" id="bo_table" class="uk-select">
                <option>선택해주세요.</option>
                <?php
                for ($k=0; $board_row=sql_fetch_array($board_sql); $k++) {
                ?>
                <option value="<?=$board_row['bo_table']?>"><?=$board_row['bo_subject']?></option>
                <?php }?>
              </select>
            </td>
          </tr>

          <tr>
            <td>출력갯수</td>
            <td>
              <input type="text" name="list_count" id="list_count" class="uk-input">
            </td>
          </tr>

          <tr>
            <td>노출글자수</td>
            <td>
              <input type="text" name="char_count" id="char_count" class="uk-input">
            </td>
          </tr>
        </table>

        <div style="text-align:center; padding:20px 0px;">
          <input type="submit" value="최신게시물 설정" name="act_button" class="btn_submit btn" accesskey="s">
          <input type="submit" value="최신게시물 삭제" name="act_button" class="btn_submit btn" accesskey="s">
        </div>
      </form>
    </div>
</div>



<!-- 전송폼 스킨설정 -->
<div id="form_skin" uk-modal>
  <div class="uk-modal-dialog uk-modal-body" style="width:830px; padding:0px;">
    <button class="uk-modal-close-default" type="button" uk-close></button>
    <iframe id="form_skin_iframe" src="./form_setup.php" style="width:100%; height:700px; margin:0px;"></iframe>
  </div>
</div>




<script>
// 삭제.
function send_update(name,id){
  var delalert = confirm("정말 삭제 하시겠습니까?");
  if(delalert == true){
    location.href="./content_block_update.php?w=d&file_name="+name+"&id="+id+"";
  }
}
// 미리보기
function preview(name){
  window.open('<?=G5_THEME_URL?>/preview.php?name='+name+'');
}
// 블럭 다운로드
function blockDownload(name) {
  location.href="./content_block_update.php?w=download&file_name="+name;
}

function option(name,table,skin_name,list_count,char_count){
  $('#block_name').attr('value',name);

  $('#bo_table').val(table).prop("selected", true);
  $('#skin_name').val(skin_name).prop("selected", true);
  $('#list_count').attr('value',list_count);
  $('#char_count').attr('value',char_count);
}

function option2(name){
  $('#form_skin_iframe').attr('src','./form_setup.php?name='+name);
}
</script>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
