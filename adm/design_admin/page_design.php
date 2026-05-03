<?php
$sub_menu = "600400";
include_once('_common.php');

auth_check($auth[$sub_menu], 'r');
/*
if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
$g5['title'] = "페이지디자인 설정";
include_once(G5_ADMIN_PATH.'/admin.head.php');

$sql = " select * from g5_content ";
$result = sql_query($sql);
?>

<form name="fconfigform" id="fconfigform" method="post" action="#" onsubmit="return fconfigform_submit(this);" enctype="MULTIPART/FORM-DATA">
<input type="hidden" name="token" value="" id="token">

<div class="local_desc01 local_desc">
  <p>
      페이지 디자인은 게시판 > 내용관리에서 추가후 디자인이 가능 합니다.
  </p>
</div>

<section>
    <h2 class="h2_frm">페이지 설정</h2>
    <?php echo $pg_anchor ?>

    <div class="tbl_frm01 tbl_wrap">
      <table>
        <tbody>
        <?php for ($i=0; $row=sql_fetch_array($result); $i++) {?>
        <tr>
          <th scope="row"><?=$row['co_subject']?></th>
          <td>
              <a href="./block_setup_layout.php?name=<?=$row['co_id']?>&page_name=<?=$row['co_subject']?>" class="btn btn_02">디자인 설정</a>
          </td>
        </tr>
        <?php }?>
        </tbody>
      </table>
    </div>
</section>


<!--
<div class="btn_fixed_top btn_confirm">
  <input type="submit" value="확인" name="act_button" class="btn_submit btn" accesskey="s">
</div>
-->


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
