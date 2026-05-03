<?php
$sub_menu = "700010";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "관리자메뉴 설정";
include_once(G5_ADMIN_PATH.'/admin.head.php');
?>
<style>
.btn_submit {background:#6b8196 !important; color:#fff ;}
</style>

<form name="fconfigform" id="fconfigform" method="post" action="./admin_menu_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">



<section id="anc_cf">
    <h2 class="h2_frm">관리자메뉴 설정</h2>
    <?php echo $pg_anchor ?>

    <div class="local_desc01 local_desc">
      관리자페이지 메뉴를 설정합니다.
    </div>


    <div class="tbl_frm01 tbl_wrap">
      <table>
        <caption>컨텐츠 블럭 생성</caption>
        <colgroup>
            <col class="grid_4">
            <col>
        </colgroup>
        <tbody>

        <tr>
            <th scope="row">메뉴설정</th>
            <td>
                <input type="text" name="file_name" class="frm_input" placeholder="메뉴이름">
                <input type="submit" value="생성" name="act_button" class="btn_submit btn" accesskey="s">
            </td>
        </tr>

        </tbody>
      </table>
    </div>
</section>


<section>
    <h2 class="h2_frm">관리자메뉴 관리</h2>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <colgroup>
          <col width="20%">
        </colgroup>
        <tbody>
          <?php
          // CSS 파일가져오기
          $sql = " select * from g5_admin_menu where sub_id = '' ";
          $result = sql_query($sql);

          for ($i=0; $row=sql_fetch_array($result); $i++) {
          ?>
          <tr>
            <td scope="row"><?=$row['name']?></td>
            <td style="line-height:25px;">

            <a onclick="add_v('<?=$row['id']?>')" class="btn_submit btn" style="cursor:pointer" uk-toggle="target: #admin_add">추가</a>
            <a onclick="modify_v('<?=$row['id']?>')" class="btn_submit btn" style="cursor:pointer">수정</a>

            <?php
            $sql2 = " select count(*) as cnt from g5_admin_menu where sub_id = '".$row['id']."' ";
            $result2 = sql_fetch($sql2);
            if(!$result2['cnt']){
            ?>
            <a href="./admin_menu_update.php?mode=menudel&menu_id=<?=$row['id']?>" class="btn_submit btn">삭제</a>
            <?php }?>
            <div class="modify_v_<?=$row['id']?>" style="display:none; padding-top:10px;">
              <input type="text" name="modify_menu[]" class="frm_input" value="<?=$row['name']?>">
              <input type="hidden" name="origin_menu[]" class="frm_input" value="<?=$row['name']?>">
              <input type="submit" value="수정" name="act_button" class="btn_submit btn" accesskey="s">
              <a href="javascript:close('<?=$row['id']?>');" class="btn_submit btn ">닫기</a>
            </div>

            </td>
          </tr>

          <?php
          $sql1 = " select * from g5_admin_menu where sub_id = '".$row['id']."' ";
          $result1 = sql_query($sql1);

          for ($j=0; $row1=sql_fetch_array($result1); $j++) {
          ?>
          <tr>
            <td scope="row">L <?=$row1['name']?></td>
            <td>

              <a href="./admin_menu_update.php?sub_id=<?=$row1['id']?>&mode=del" class="btn btn_submit">삭제</a>

            </td>
          </tr>
        <?php
          }
            }
        ?>

        </tbody>
      </table>
    </div>

</section>

<div class="btn_fixed_top btn_confirm">
  <input type="submit" value="확인" name="act_button" class="btn_submit btn" accesskey="s">
</div>

</form>


<!-- 메뉴추가 팝업 -->
<div id="admin_add" uk-modal>
  <div class="uk-modal-dialog uk-modal-body">
    <button class="uk-modal-close-default" type="button" uk-close></button>
    <h2 class="uk-modal-title">관리자메뉴 추가</h2>
    <form name="fconfigform" method="post" action="./admin_menu_update.php" onsubmit="return fconfigform_submit(this);">
      <input type="hidden" name="type" value="latest">
      <input type="hidden" name="menu_id" value="" id="menu_id">


      <div style="padding-top:10px; width:100%;">
        게시판연결
        <select name="board_id" style="width:150px;">
        <?php
        // 게시판 연동.
        $board_sql = " select * from g5_board ";
        $board_result = sql_query($board_sql);
        for ($k=0; $board_row=sql_fetch_array($board_result); $k++) {
        ?>
        <option value="<?=$board_row['bo_table']?>"><?=$board_row['bo_subject']?></option>
        <?php }?>
        </select>
      </div>

      <div style="padding-top:5px; width:100%;">
        게시판스킨
        <select name="board_skin" style="width:150px;">
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
                      <option value="<?=$entry?>"><?=$entry?></option>
                      <?php
                    }
                }
                closedir($dh);
            }
        }
        ?>
        </select>

        <input type="submit" value="추가" name="act_button" class="btn_submit btn" accesskey="s">
      </div>

    </form>
  </div>
</div>


<script>
// 삭제.
function send_del(name,part){
  var delalert = confirm("정말 삭제 하시겠습니까?");
  if(delalert == true){
    location.href="./block_setup_update.php?w=d&name="+name+"&part="+part;
  }
}

function add_v(arg){
  $('#menu_id').attr('value',arg);
}
function modify_v(arg){
  $('.modify_v_'+arg).show();
}
function close(arg){
  $('.modify_v_'+arg).hide();
}
</script>

<?php
include_once(G5_ADMIN_PATH.'/admin.tail.php');
?>
