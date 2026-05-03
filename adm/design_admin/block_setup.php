<?php
$sub_menu = "600300";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "레이아웃 설정";
include_once(G5_ADMIN_PATH.'/admin.head.php');
?>

<form name="fconfigform" id="fconfigform" method="post" action="./block_setup_update.php" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">



<section>
    <h2 class="h2_frm">레이아웃 구성</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <tbody>
        <tr>
            <th scope="row">메인레이아웃 설정</th>
            <td>
                <a href="./block_setup_layout.php?name=mainpage" class="btn btn_02">레이아웃 설정</a>
            </td>
        </tr>
        </tbody>
      </table>
    </div>
</section>




<section id="anc_cf">
    <h2 class="h2_frm">기본 CSS설정</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <tbody>
        <tr>
            <th scope="row">파일 업로드</th>
            <td>
                <input type="file" name="file_upload1" id="file_upload1" style="float:left;">
                <input type="submit" value="CSS 파일업로드" name="act_button" class="btn_submit btn" accesskey="s">
                <div style="padding-top:10px;">파일경로 : <?php echo G5_THEME_PATH.'/css/';?></div>

                <?php
                // CSS 파일가져오기
                $sql = " select * from g5_block_setup where setup_2 = 'css' ";
                $result = sql_query($sql);

                for ($i=0; $row=sql_fetch_array($result); $i++) {
                ?>
                <tr>
                  <th scope="row"><?=$row['name']?>.css</th>
                  <td style="line-height:25px;">
                  <a href="block_setup_edit.php?name=<?=$row['name']?>.css&mode1=css">파일수정</a>

                  <?php if($row['name'] == 'default_shop' || $row['name'] == 'default' || $row['name'] == 'mobile_shop' || $row['name'] == 'mobile'){
                    $display_none = 'style="display:none"';
                  }else{
                    $display_none = '';
                  }?>
                  <span <?=$display_none?>>
                  &nbsp;|&nbsp;
                  <a href="javascript:send_del('<?=$row['name']?>','css')">삭제</a>
                  &nbsp;|&nbsp;사용여부 <input type="checkbox" name="checked[]" value="<?=$row['name']?>|css" id="checked" <?php if($row['setup_1']=='y'){echo "checked";}?>>
                  </span>
                  <br>
                  <input type="hidden" name="checked[]" value=",">
                  <input type="hidden" name="checked_name[]" value="<?=$row['name']?>">
                  <input type="hidden" name="checked_ex[]" value="css">
                  </td>
                </tr>
                <?php }?>
            </td>
        </tr>
        </tbody>
      </table>
    </div>
</section>


<section>
    <h2 class="h2_frm">기본 JS설정</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <tbody>
        <tr>
            <th scope="row">기본JS 파일</th>
            <td>
                <input type="file" name="file_upload2" id="file_upload2" style="float:left;">
                <input type="submit" value="JS 파일업로드" name="act_button" class="btn_submit btn" accesskey="s">
                <div style="padding-top:10px;">경로 : <?php echo G5_THEME_PATH.'/js/';?></div>

                <?php
                // CSS 파일가져오기
                $sql1 = " select * from g5_block_setup where setup_2 = 'js' ";
                $result1 = sql_query($sql1);

                for ($i=0; $row1=sql_fetch_array($result1); $i++) {
                ?>
                <tr>
                  <th scope="row"><?=$row1['name']?>.js</th>
                  <td style="line-height:25px;">
                  <a href="block_setup_edit.php?name=<?=$row1['name']?>.js&mode1=js">파일수정</a>&nbsp;|&nbsp;
                  <a href="javascript:send_del('<?=$row1['name']?>','js')">삭제</a>
                  &nbsp;|&nbsp;사용여부 <input type="checkbox" name="checked[]" value="<?=$row1['name']?>|js" id="checked" <?php if($row1['setup_1']=='y'){echo "checked";}?>>
                  <br>
                  <input type="hidden" name="checked[]" value=",">
                  <input type="hidden" name="checked_name[]" value="<?=$row1['name']?>">
                  <input type="hidden" name="checked_ex[]" value="js">
                  </td>
                </tr>
                <?php }?>
            </td>
        </tr>
        </tbody>
      </table>
    </div>
</section>


<section>
    <h2 class="h2_frm">하단 스크립트 설정</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <tbody>
        <tr>
            <th scope="row">하단 스크립트 내용</th>
            <td>
              <?php
              $sql1 = " select * from g5_block_setup_meta where name = 'mainpage' ";
              $result1 = sql_fetch($sql1);
              ?>
                <textarea name="metaAdd"><?=$result1['setup_1']?></textarea>
            </td>
        </tr>
        </tbody>
      </table>
    </div>
</section>



<div class="btn_fixed_top btn_confirm">
  <input type="submit" value="확인" name="act_button" class="btn_submit btn" accesskey="s">
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
