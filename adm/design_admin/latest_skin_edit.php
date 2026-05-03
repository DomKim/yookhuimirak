<?php
$sub_menu = "600250";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$name = $_GET['name'];
$g5['title'] = "최신게시물스킨 ".$name."파일수정";
include_once(G5_ADMIN_PATH.'/admin.head.php');

$file_path = G5_THEME_PATH.'/skin/latest/'.$name;

// 에디터 테마 변수
$edit_theme = $_COOKIE['edit_theme'];
if($_COOKIE['edit_theme']){
  if(!($edit_theme == 'default' || $edit_theme == '3024-day' || $edit_theme == 'base16-light' || $edit_theme == 'duotone-light' || $edit_theme == 'eclipse' || $edit_theme == 'elegant' || $edit_theme == 'idea' || $edit_theme == 'mdn-like' || $edit_theme == 'neat' || $edit_theme == 'paraiso-light' || $edit_theme == 'ttcn' || $edit_theme == 'xq-light' || $edit_theme == 'yeti')){
    $themeColor = '#272829';
    $themeFontColor = '#fff';
    $scroll_bg = '#272829';
    $scrollbar = '#5e5e5e';
    $border_bottom = '#373737';
  }else{
    $themeColor = '#e7e7e7';
    $themeFontColor = '#000';
    $scroll_bg = '#c7c7c7';
    $scrollbar = '#6e6e6e';
    $border_bottom = '#b0b0b0';
  }
}else{
  $themeColor = '#e7e7e7';
  $themeFontColor = '#000';
  $scroll_bg = '#c7c7c7';
  $scrollbar = '#6e6e6e';
  $border_bottom = '#b0b0b0';
}
if(!$edit_theme){
  $edit_theme = 'default';
}
?>
<style>
textarea {font-size: 14px;}
</style>
<link rel="stylesheet" href="<?=G5_ADMIN_URL?>/design_admin/css/jquery-ui.min.css">
<script src="<?=G5_ADMIN_URL?>/design_admin/js/jquery-ui.min.js"></script>

<link rel="stylesheet" href="<?=G5_ADMIN_URL?>/design_admin/css/codemirror.css">
<link rel="stylesheet" href="<?=G5_ADMIN_URL?>/design_admin/theme/<?=$edit_theme?>.css">
<link rel="stylesheet" href="<?=G5_ADMIN_URL?>/design_admin/addon/display/fullscreen.css">
<link rel="stylesheet" href="<?=G5_ADMIN_URL?>/design_admin/addon/hint/show-hint.css">
<link rel="stylesheet" href="<?=G5_ADMIN_URL?>/design_admin/addon/dialog/dialog.css">
<link rel="stylesheet" href="<?=G5_ADMIN_URL?>/design_admin/addon/search/matchesonscrollbar.css">

<script src="<?=G5_ADMIN_URL?>/design_admin/js/codemirror.js"></script>

<script src="<?=G5_ADMIN_URL?>/design_admin/addon/hint/show-hint.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/hint/xml-hint.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/hint/html-hint.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/selection/active-line.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/edit/closetag.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/fold/xml-fold.js"></script>

<script src="<?=G5_ADMIN_URL?>/design_admin/mode/xml/xml.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/mode/javascript/javascript.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/mode/css/css.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/mode/htmlmixed/htmlmixed.js"></script>

<script src="<?=G5_ADMIN_URL?>/design_admin/addon/edit/matchtags.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/edit/matchbrackets.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/display/fullscreen.js"></script>

<script src="<?=G5_ADMIN_URL?>/design_admin/keymap/emacs.js"></script>

<script src="<?=G5_ADMIN_URL?>/design_admin/addon/dialog/dialog.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/search/searchcursor.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/search/search.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/scroll/annotatescrollbar.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/search/matchesonscrollbar.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/search/jump-to-line.js"></script>
<script src="<?=G5_ADMIN_URL?>/design_admin/addon/scroll/simplescrollbars.js"></script>

<script>
function editorCtrlS() {

  editor1.save();
  var name = '<?=$name?>';
  var content1 = editor1.getValue();
  editor2.save();
  var content2 = editor2.getValue();


  $.ajax({
      url: "./latest_skin_edit_up.php",
      type: "POST",
      data:{
        'name':name,
        'file_html':content1,
        'file_css':content2
  		},
      dataType: 'text',
      success: function(result){
        $('#container_title i').css('color','#959595');
        $('.container_title').focus();
      }
  });


}
</script>

<style>
  html {overflow-x:hidden; overflow-y:hidden; background: <?=$themeColor?>}
  .CodeMirror { height: calc(100vh - 80px); border:0px; font-size: 14px;}
  .container_wr { padding:0px; }
  #wrapper {margin:0px;}
  #container {padding: 0px;}
  .tbl_wrap {margin: 0px;} .tbl_frm01 td {padding:0px;}
  .h2_frm {position: relative; width:100%; z-index: 100; background: <?=$themeColor?>; color:<?=$themeFontColor?>; margin:0px; padding:3px; border: 0px; font-size: 10px; font-style: italic; font-weight: 300; text-align: center;}
  textarea {border:0px;}
  table{border:0px;}
  #left {width: 60%; height:calc(100vh - 100px); float: left; border-right:5px solid <?=$themeColor?>;background: <?=$themeColor?>}
  #right {width: 40%; height:calc(100vh - 90px); float: left; background: <?=$themeColor?>;}
  #right .area1 {border-bottom:2px solid <?=$themeColor?>; height:auto;clear: both; background: <?=$themeColor?>;}
  #right .area2 {border-bottom:2px solid <?=$themeColor?>; height:auto;clear: both; background: <?=$themeColor?>;}
  #right .area3 {border-bottom:2px solid <?=$themeColor?>; height:auto;clear: both; background: <?=$themeColor?>; border-bottom:0px;}
  #right .CodeMirror { border:0px; font-size: 14px;}
  #ft {display: none;}
  .images {overflow: hidden; overflow-y: scroll;}
  .images_area {height:auto;}
  .tbl_frm01 th {background: <?=$themeColor?>; color:<?=$themeFontColor?>; border:0px; border-bottom:1px solid <?=$border_bottom?>;}
  .tbl_frm01 td {color:<?=$themeFontColor?>; border:0px; border-bottom:1px solid <?=$border_bottom?>; background: <?=$themeColor?> !important;}
  .frm_info {color:#ddd;} .img_copy{background: <?=$themeColor?>; padding:3px;width: 230px; border:0px; color:#ddd;}
  .file_up {color:<?=$themeFontColor?>; border:1px solid <?=$border_bottom?>; margin-right:10px; padding:3px;}
  .img_copy {color:<?=$themeFontColor?>}

  #color-theme {display: none;}
  .scroll-top {display: none;}

  ::-webkit-scrollbar{width: 7px;}
  ::-webkit-scrollbar-track {background-color:<?=$scroll_bg?>;}
  ::-webkit-scrollbar-thumb {background-color:<?=$scrollbar?>;border-radius: 10px;}
  ::-webkit-scrollbar-thumb:hover {background: #555;}
  ::-webkit-scrollbar-button:start:decrement,::-webkit-scrollbar-button:end:increment {
  width:16px;height:0px;background:#f1ef79;}

  #latest_source .CodeMirror {height:100px !important;}

  /* scrollbar css */
  .CodeMirror-simplescroll-horizontal div, .CodeMirror-simplescroll-vertical div {
    position: absolute;background: <?=$scrollbar?>;-moz-box-sizing: border-box;box-sizing: border-box;border-radius: 2px;
  }
  .CodeMirror-simplescroll-horizontal, .CodeMirror-simplescroll-vertical {
    position: absolute;z-index: 6;background: <?=$scroll_bg?>;
  }
  .CodeMirror-simplescroll-horizontal {
    bottom: 0; left: 0;height: 8px;
  }
  .CodeMirror-simplescroll-horizontal div {
    bottom: 0;height: 100%;
  }
  .CodeMirror-simplescroll-vertical {
    right: 0; top: 0;width: 8px;
  }
  .CodeMirror-simplescroll-vertical div {
    right: 0;width: 100%;
  }

  .CodeMirror-overlayscroll .CodeMirror-scrollbar-filler, .CodeMirror-overlayscroll .CodeMirror-gutter-filler {
    display: none;
  }
  .CodeMirror-overlayscroll-horizontal div, .CodeMirror-overlayscroll-vertical div {
    position: absolute;background: #bcd;border-radius: 3px;
  }
  .CodeMirror-overlayscroll-horizontal, .CodeMirror-overlayscroll-vertical {
    position: absolute;z-index: 6;
  }
  .CodeMirror-overlayscroll-horizontal {
    bottom: 0; left: 0;height: 6px;
  }
  .CodeMirror-overlayscroll-horizontal div {
    bottom: 0;height: 100%;
  }

  .CodeMirror-overlayscroll-vertical {
    right: 0; top: 0;width: 6px;
  }
  .CodeMirror-overlayscroll-vertical div {
    right: 0;width: 100%;
  }

</style>

<form name="fconfigform" id="fconfigform" method="post" action="./latest_skin_edit_up.php" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">
<input type="hidden" name="name" value="<?=$name?>">

<div id="anc_cf_block">

  <div id="left">
    <!-- HTML -->
    <h2 class="h2_frm">latest.skin.php</h2>
    <div class="tbl_frm01 tbl_wrap">
      <?php
      $htmlFile = $fp = fopen($file_path.'/latest.skin.php', 'r');
      if ($htmlFile) {
         $content_html = '';
         while ($line = fgets($fp, 1024)) {
            $content_html .= $line;
         }
      }
      $content_html_re = str_replace('</textarea>','</ textarea>',$content_html);
      ?>
      <textarea name="file_html" id="file_html" style="height:400px;"><?=$content_html_re?></textarea>
      <?php fclose($htmlFile); ?>
    </div>

    <script>
    var textarea = document.getElementById('file_html');
    var editor1 = CodeMirror.fromTextArea(textarea, {
        lineNumbers: true,
        lineWrapping: true,
        styleActiveLine: true,
        autoCloseTags: true,
        scrollbarStyle: "simple",
        mode: "text/html",
        theme: "<?=$edit_theme?>",
        extraKeys: {"Ctrl-Space": "autocomplete"},
        val: textarea.value,
        matchBrackets: true,
        matchTags: {bothTags: true},
        extraKeys: {
          "F11": function(cm) {
            cm.setOption("fullScreen", !cm.getOption("fullScreen"));
          },
          "Esc": function(cm) {
            if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
          },
          "Ctrl-Space": "autocomplete",
          "Alt-F": "findPersistent",
          "Ctrl-S": editorCtrlS,
          "Ctrl-J": "toMatchingTag"
        }
    });
    </script>
  </div>
  <div id="right">
    <!-- CSS -->
    <div class='area1'>
      <h2 class="h2_frm">CSS</h2>
        <div class="tbl_frm01 tbl_wrap">
          <?php
          $cssFile = $fp = fopen($file_path.'/style.css', 'r');
          if ($cssFile) {
             $content_css = '';
             while ($line = fgets($fp, 1024)) {
                $content_css .= $line;
             }
          }
          ?>
          <textarea name="file_css" id="file_css"><?=$content_css?></textarea>

          <?php fclose($cssFile); ?>
        </div>

        <script>
        var textarea = document.getElementById('file_css');
        var editor2 = CodeMirror.fromTextArea(textarea, {
            lineNumbers: true,
            lineWrapping: true,
            styleActiveLine: true,
            scrollbarStyle: "simple",
            mode: "text/css",
            theme: "<?=$edit_theme?>",
            val: textarea.value,
            extraKeys: {
              "F11": function(cm) {
                cm.setOption("fullScreen", !cm.getOption("fullScreen"));
              },
              "Esc": function(cm) {
                if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
              },
              "Ctrl-Space": "autocomplete",
              "Alt-F": "findPersistent",
              "Ctrl-S": editorCtrlS
            }
        });
        </script>
    </div>

    <!-- 이미지업로드 -->
    <div class='area3 images'>
    <div class="images_area">

      <?php
      $latest_query = 'select * from g5_content_block where block_name = "'.$name.'" ';
      $latest_sql = sql_fetch($latest_query);
      if($latest_sql['type'] == 'latest'){ ?>
        <h2 class="h2_frm">최신 게시물 소스</h2>
        <div class="tbl_frm01 tbl_wrap latest_source" style="padding:10px;">
          <textarea id="latest_source">/* 최신게시물 가져오기 */
$<?=$name?>_latest = sql_fetch('select * from g5_content_block where block_name = "<?=$name?>" ');

<?php echo '<?php echo latest(\'theme/\'.$'.$name.'_latest["skin_name"],$'.$name.'_latest["bo_table"],$'.$name.'_latest["list_count"],$'.$name.'_latest["char_count"]); ?>'; ?>
          </textarea>
          <script>
          var textarea = document.getElementById('latest_source');
          var editor4 = CodeMirror.fromTextArea(textarea, {
              lineNumbers: true,
              lineWrapping: true,
              styleActiveLine: true,
              scrollbarStyle: "simple",
              mode: "text/html",
              theme: "<?=$edit_theme?>",
              val: textarea.value,
              matchBrackets: true,
              extraKeys: {
                "F11": function(cm) {
                  cm.setOption("fullScreen", !cm.getOption("fullScreen"));
                },
                "Esc": function(cm) {
                  if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
                },
                "Ctrl-Space": "autocomplete",
                "Alt-F": "findPersistent",
                "Ctrl-S": editorCtrlS
              }
          });
          </script>
        </div>
      <?php }?>
      <h2 class="h2_frm">파일 업로드</h2>
      <div class="tbl_frm01 tbl_wrap" style="padding:10px;">
        <input type="file" name="img_up[]" id="img_up" style="float:left;" multiple="multiple" class="file_up">
        <input type="submit" value="업로드" class="btn_submit btn" accesskey="s">
      </div>

      <h2 class="h2_frm">업로드된 파일</h2>
      <div class="tbl_frm01 tbl_wrap">
        <table>
          <tbody>


                    <div style="padding:10px 0px; clear:both;">
                    <?php
                    // 폴더명 지정
                    $dir = G5_THEME_PATH."/skin/latest/".$name."/img";
                    $srcURL = G5_THEME_URL."/skin/latest/".$name."/img";
                    $srcURL2 = "<?=G5_THEME_URL?>/skin/latest/".$name."/img";
                    //echo $srcURL;
                    recursive_file_list($dir,$srcURL,$srcURL2);

                    function recursive_file_list($dir,$srcURL,$srcURL2){
                        if(is_dir($dir)) {
                            if($dh = opendir($dir)) {
                                while(($entry = readdir($dh)) !== false) {
                                    if($entry == '.' || $entry == '..')
                                        continue;
                                    $subdir = $dir.'/'.$entry;
                                    if(is_dir($subdir)) {
                                        recursive_file_list($subdir);
                                    } else {
                                        echo '
                                        <tr>
                                        <th scope="row" style="text-align:center;"><img src="'.$srcURL.'/'.$entry.'" height="50px"></th>
                                        <td style="line-height:25px;">파일명 : '.$entry.'&nbsp;&nbsp;
                                        <input type="checkbox" name="img_del[]" value="'.$entry.'" id="img_del"> <input type="submit" value="삭제" class="btn_submit" accesskey="s" style="padding:3px 10px; border:0px; border-radius:5px;"> <br>
                                        <input type="text" class="img_copy" value="<img src=\''.$srcURL2.'/'.$entry.'\'>" >...</td></tr>';
                                    }
                                }
                                closedir($dh);
                            }
                        }
                    }
                    ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </div>



</div>

<div class="btn_fixed_top btn_confirm">
  <a href="./latest_skin.php" class="btn btn_02">취소</a>
  <a href="javascript:preview('<?=$name?>');" class="btn btn_02">미리보기</a>
  <input type="submit" value="업데이트" class="btn_submit btn" accesskey="s">
</div>

</form>
<script>
// 미리보기
function preview(name){
  window.open('<?=G5_THEME_URL?>/latest_preview.php?name='+name+'');
}
// 이미지소스 카피
$('.img_copy').on('click',function(){
  $(this).select();
  document.execCommand('copy');
  alert('내용이 복사 되었습니다.');
});

// onkeypress event
document.onkeypress = function(event){
  // detect key pressed
  var key = event.keyCode;
  if (event.ctrlKey) {
    //if (key === ('R').charCodeAt(0) - 64) editorCtrlR();
    if (key === ('S').charCodeAt(0) - 64) editorCtrlS();
  }
}

$('#container_title').append(' <i class="fa fa-edit"></i>');
// 텍스트 입력중일때 표시.
$("textarea").on("keyup", function() {
  $('#container_title i').css('color','#fff');
});

var height = $('#right').height();
var height_3 = height/2;
$('#right .CodeMirror').css('height',height_3+'px');
$('.latest_source .CodeMirror').css('height','170px');
$('.images').css('height',height_3+'px');

var height_img = $('.images_area').height()+100;
$('.images_area').css('height',height_img+'px');

$(window).resize(function(){
  var height = $('#right').height();
  var height_3 = height/2;
  $('#right .CodeMirror').css('height',height_3+'px');
  $('.latest_source .CodeMirror').css('height','170px');
  $('.images').css('height',height_3+'px');
});


$("#right .area1").resizable({
  resize:function(event, ui){
    var ogheight = ui.size.height;
    var height = $('#right').height();
    var harf_height = height - ogheight;
    var height_2 = harf_height/2;

    $('#right .CodeMirror').css('height',height_2+'px');
    $('.latest_source .CodeMirror').css('height','170px');
    $(this).find('.CodeMirror').css('height',ogheight);
  }
});


$("#left").resizable({
  resize:function(event, ui){
    var ogwidth = ui.size.width;
    var area1_size = $("#right .area1").height();

    $("#right").css('width','calc(100% - '+ogwidth+'px)');
    $("#right .area1 .CodeMirror").css('height',area1_size);

  }
});


</script>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
